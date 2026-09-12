import { describe, expect, it, vi } from "vitest";
import { processWebhookDeliveryBatch } from "./webhook-worker-orchestrator";
import { StoredWebhookDelivery, WebhookDeliveryStore } from "./webhook-delivery-repository";

function delivery(id: string): StoredWebhookDelivery {
  return {
    id,
    userId: "user-1",
    subscriptionId: "sub-1",
    eventId: id,
    eventType: "case.updated",
    payload: { id },
    signature: "signature",
    state: "PENDING",
    attempt: 0,
    maxAttempts: 5,
    nextAttemptAt: null,
  };
}

function storeFor(ids: string[]): WebhookDeliveryStore {
  const records = new Map(ids.map((id) => [id, delivery(id)]));
  return {
    insertIfAbsent: vi.fn(async (input) => ({ ...input, id: "new-id" })),
    claimDue: vi.fn(async ({ id }) => {
      const record = records.get(id);
      return record && (record.state === "PENDING" || record.state === "RETRYING") ? { ...record } : null;
    }),
    updateResult: vi.fn(async (input) => {
      const record = records.get(input.id) ?? delivery(input.id);
      const updated = { ...record, ...input };
      records.set(input.id, updated);
      return updated;
    }),
  };
}

describe("processWebhookDeliveryBatch", () => {
  it("deduplicates IDs and aggregates outcomes", async () => {
    const store = storeFor(["a", "b"]);
    const result = await processWebhookDeliveryBatch(
      store,
      ["a", "a", "b", ""],
      async () => ({ statusCode: 200 }),
      { concurrency: 2, now: new Date("2026-09-12T10:00:00.000Z") },
    );

    expect(result.processed).toBe(2);
    expect(result.delivered).toBe(2);
    expect(result.retrying).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it("caps invalid concurrency at a safe minimum", async () => {
    const store = storeFor(["a"]);
    const result = await processWebhookDeliveryBatch(store, ["a"], async () => ({ statusCode: 200 }), {
      concurrency: 0,
    });
    expect(result.processed).toBe(1);
  });
});
