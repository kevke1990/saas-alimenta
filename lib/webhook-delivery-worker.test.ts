import { describe, expect, it, vi } from "vitest";
import { processWebhookDelivery } from "./webhook-delivery-worker";
import type { StoredWebhookDelivery, WebhookDeliveryStore } from "./webhook-delivery-repository";

function makeDelivery(overrides: Partial<StoredWebhookDelivery> = {}): StoredWebhookDelivery {
  return {
    id: "delivery-1",
    userId: "user-1",
    subscriptionId: "sub-1",
    eventId: "event-1",
    payload: { hello: "world" },
    signature: "signature",
    eventType: "case.updated",
    state: "PENDING",
    attempt: 0,
    maxAttempts: 5,
    nextAttemptAt: null,
    ...overrides,
  };
}

function makeStore(delivery: StoredWebhookDelivery | null): WebhookDeliveryStore {
  return {
    insertIfAbsent: vi.fn(async (input) => ({ ...input, id: "created" })),
    claimDue: vi.fn(async () => delivery),
    updateResult: vi.fn(async (input) => ({ ...delivery, ...input } as StoredWebhookDelivery)),
  };
}

describe("processWebhookDelivery", () => {
  it("delivers a successful webhook and persists the result", async () => {
    const store = makeStore(makeDelivery());
    const result = await processWebhookDelivery(store, "delivery-1", async () => ({ statusCode: 204 }), new Date("2026-09-12T10:00:00.000Z"));

    expect(result).toEqual({ status: "DELIVERED", attempt: 1, statusCode: 204 });
    expect(store.updateResult).toHaveBeenCalledWith(expect.objectContaining({ id: "delivery-1", state: "DELIVERED", statusCode: 204 }));
  });

  it("schedules a retry for a transient failure", async () => {
    const store = makeStore(makeDelivery());
    const result = await processWebhookDelivery(store, "delivery-1", async () => ({ statusCode: 503, error: "temporarily unavailable" }), new Date("2026-09-12T10:00:00.000Z"));

    expect(result.status).toBe("RETRYING");
    expect(result).toMatchObject({ attempt: 1, statusCode: 503 });
    expect(store.updateResult).toHaveBeenCalledWith(expect.objectContaining({ state: "RETRYING", attempt: 1, statusCode: 503 }));
  });

  it("converts transport exceptions into retryable failures", async () => {
    const store = makeStore(makeDelivery());
    const result = await processWebhookDelivery(store, "delivery-1", async () => {
      throw new Error("network down");
    });

    expect(result).toMatchObject({ status: "RETRYING", statusCode: 503, attempt: 1 });
    expect(store.updateResult).toHaveBeenCalledWith(expect.objectContaining({ error: "network down" }));
  });

  it("skips a delivery that cannot be claimed", async () => {
    const store = makeStore(null);
    const transport = vi.fn(async () => ({ statusCode: 204 }));
    const result = await processWebhookDelivery(store, "missing", transport);

    expect(result).toEqual({ status: "SKIPPED", reason: "NOT_DUE" });
    expect(transport).not.toHaveBeenCalled();
  });
});
