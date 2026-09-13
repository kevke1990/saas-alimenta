import { describe, expect, it } from "vitest";
import { dispatchWebhookEvent } from "./webhook-dispatcher";
import { StoredWebhookDelivery, WebhookDeliveryStore } from "./webhook-delivery-repository";

function createStore() {
  const records: StoredWebhookDelivery[] = [];
  const store: WebhookDeliveryStore = {
    async insertIfAbsent(input) {
      const existing = records.find(
        (record) => record.subscriptionId === input.subscriptionId && record.eventId === input.eventId,
      );
      if (existing) return existing;
      const record = { ...input, id: `delivery-${records.length + 1}` };
      records.push(record);
      return record;
    },
    async claimDue() {
      throw new Error("not used");
    },
    async updateResult() {
      throw new Error("not used");
    },
  };
  return { records, store };
}

describe("webhook domain dispatcher", () => {
  it("creates one signed pending delivery per subscription", async () => {
    const { records, store } = createStore();
    const result = await dispatchWebhookEvent(store, {
      event: {
        eventId: "case.updated-1",
        eventType: "case.updated",
        occurredAt: "2026-09-13T10:00:00.000Z",
        payload: { caseId: "case-1", version: 2 },
      },
      subscriptions: [
        { id: "sub-a", userId: "user-a", secret: "secret-a" },
        { id: "sub-b", userId: "user-b", secret: "secret-b" },
      ],
    });

    expect(result.enqueued).toBe(2);
    expect(records).toHaveLength(2);
    expect(records.every((record) => record.state === "PENDING")).toBe(true);
    expect(records.every((record) => record.attempt === 0)).toBe(true);
    expect(records[0].signature).not.toBe(records[1].signature);
    expect(records[0].payload).toContain('"type":"case.updated"');
  });

  it("keeps dispatch idempotent for repeated events", async () => {
    const { records, store } = createStore();
    const input = {
      event: {
        eventId: "case.updated-2",
        eventType: "case.updated",
        occurredAt: "2026-09-13T10:00:00.000Z",
        payload: { caseId: "case-2" },
      },
      subscriptions: [{ id: "sub-a", userId: "user-a", secret: "secret-a" }],
    };

    await dispatchWebhookEvent(store, input);
    await dispatchWebhookEvent(store, input);

    expect(records).toHaveLength(1);
  });
});
