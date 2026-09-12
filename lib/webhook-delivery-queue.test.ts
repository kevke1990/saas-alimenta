import { describe, expect, it } from "vitest";
import { isDeliveryDue, markDeliveryAttempt, nextRetryAt, webhookIdempotencyKey } from "./webhook-delivery-queue";

describe("webhook delivery queue primitives", () => {
  const base = {
    subscriptionId: "sub-1",
    eventId: "event-1",
    state: "PENDING" as const,
    attempt: 0,
    maxAttempts: 5,
    nextAttemptAt: null,
  };

  it("creates a stable idempotency key", () => {
    expect(webhookIdempotencyKey("sub-1", "event-1")).toBe(webhookIdempotencyKey("sub-1", "event-1"));
    expect(webhookIdempotencyKey("sub-1", "event-1")).not.toBe(webhookIdempotencyKey("sub-2", "event-1"));
  });

  it("only marks pending or due retrying records as claimable", () => {
    const now = new Date("2026-09-12T10:00:00.000Z");
    expect(isDeliveryDue(base, now)).toBe(true);
    expect(isDeliveryDue({ ...base, state: "DELIVERED" }, now)).toBe(false);
    expect(isDeliveryDue({ ...base, state: "RETRYING", nextAttemptAt: "2026-09-12T10:01:00.000Z" }, now)).toBe(false);
    expect(isDeliveryDue({ ...base, state: "RETRYING", nextAttemptAt: "2026-09-12T09:59:00.000Z" }, now)).toBe(true);
    expect(isDeliveryDue({ ...base, attempt: 5 }, now)).toBe(false);
  });

  it("increments attempts and clears the claimable retry timestamp", () => {
    expect(markDeliveryAttempt(base)).toEqual({ ...base, attempt: 1, state: "RETRYING", nextAttemptAt: null });
  });

  it("calculates deterministic retry timestamps from a supplied clock", () => {
    expect(nextRetryAt(2, new Date("2026-09-12T10:00:00.000Z"))).toBe("2026-09-12T10:00:02.000Z");
  });
});
