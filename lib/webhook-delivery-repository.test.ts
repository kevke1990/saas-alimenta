import { describe, expect, it, vi } from "vitest";
import { createWebhookDeliveryRepository, StoredWebhookDelivery, WebhookDeliveryStore } from "./webhook-delivery-repository";

type StoreState = StoredWebhookDelivery;

function makeStore(initial: StoreState): WebhookDeliveryStore {
  let value = initial;
  return {
    async insertIfAbsent(input) {
      value = { ...input, id: value.id };
      return value;
    },
    async claimDue() {
      return value;
    },
    async updateResult(input) {
      value = { ...value, ...input };
      return value;
    },
  };
}

const baseDelivery: StoredWebhookDelivery = {
  id: "delivery-1",
  userId: "user-1",
  subscriptionId: "sub-1",
  eventId: "event-1",
  eventType: "case.updated",
  payload: { id: "case-1" },
  signature: "signature",
  state: "PENDING",
  attempt: 0,
  maxAttempts: 5,
  nextAttemptAt: null,
};

describe("webhook delivery repository", () => {
  it("claims a due delivery and increments its attempt", async () => {
    const store = makeStore(baseDelivery);
    const repository = createWebhookDeliveryRepository(store);
    const claimed = await repository.claim(baseDelivery.id, new Date("2026-09-12T10:00:00.000Z"));
    expect(claimed?.attempt).toBe(1);
    expect(claimed?.state).toBe("RETRYING");
    expect(claimed?.nextAttemptAt).toBeNull();
  });

  it("does not claim a delivery that is not due", async () => {
    const store = makeStore({ ...baseDelivery, state: "RETRYING", nextAttemptAt: "2026-09-12T11:00:00.000Z" });
    const repository = createWebhookDeliveryRepository(store);
    await expect(repository.claim(baseDelivery.id, new Date("2026-09-12T10:00:00.000Z"))).resolves.toBeNull();
  });

  it("marks a delivery as delivered without another attempt", async () => {
    const store = makeStore(baseDelivery);
    const repository = createWebhookDeliveryRepository(store);
    const result = await repository.complete({ id: baseDelivery.id, statusCode: 204 });
    expect(result.state).toBe("DELIVERED");
    expect(result.statusCode).toBe(204);
    expect(result.deliveredAt).toBeTruthy();
  });

  it("keeps the adapter boundary deterministic and testable", async () => {
    const insertIfAbsent = vi.fn(async (input: Omit<StoredWebhookDelivery, "id">) => ({ ...input, id: "delivery-2" }));
    const store: WebhookDeliveryStore = {
      insertIfAbsent,
      claimDue: vi.fn(async () => null),
      updateResult: vi.fn(async (input) => ({ ...baseDelivery, ...input })),
    };
    const repository = createWebhookDeliveryRepository(store);
    await repository.enqueue(baseDelivery);
    expect(insertIfAbsent).toHaveBeenCalledOnce();
  });
});
