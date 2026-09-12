import { describe, expect, it } from "vitest";
import { normalizeWebhookEvent } from "./webhook-event-envelope";

describe("normalizeWebhookEvent", () => {
  it("normalizes timestamps and creates a stable idempotency key", () => {
    const result = normalizeWebhookEvent(
      {
        eventId: "evt_123",
        eventType: "case.updated",
        occurredAt: "2026-09-12T10:00:00+02:00",
        payload: { caseId: "case_1", changed: true },
      },
      "sub_1",
    );

    expect(result.occurredAt).toBe("2026-09-12T08:00:00.000Z");
    expect(result.idempotencyKey).toBe("sub_1:evt_123");
    expect(result.payloadHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects invalid identifiers and timestamps", () => {
    expect(() =>
      normalizeWebhookEvent(
        { eventId: "bad id", eventType: "case.updated", occurredAt: "2026-09-12", payload: {} },
        "sub_1",
      ),
    ).toThrow("Invalid webhook eventId");

    expect(() =>
      normalizeWebhookEvent(
        { eventId: "evt_1", eventType: "case.updated", occurredAt: "not-a-date", payload: {} },
        "sub_1",
      ),
    ).toThrow("Invalid webhook occurredAt");
  });

  it("keeps the payload hash deterministic", () => {
    const first = normalizeWebhookEvent(
      { eventId: "evt_1", eventType: "case.updated", occurredAt: "2026-09-12T00:00:00Z", payload: { a: 1 } },
      "sub_1",
    );
    const second = normalizeWebhookEvent(
      { eventId: "evt_1", eventType: "case.updated", occurredAt: "2026-09-12T00:00:00Z", payload: { a: 1 } },
      "sub_1",
    );

    expect(first.payloadHash).toBe(second.payloadHash);
    expect(first.idempotencyKey).toBe(second.idempotencyKey);
  });
});
