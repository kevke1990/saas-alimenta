import { describe, expect, it } from "vitest";
import { mapWebhookDeliveryRow } from "./webhook-delivery-sql-store";

describe("webhook delivery SQL store", () => {
  it("maps database status and nullable fields to the worker contract", () => {
    const mapped = mapWebhookDeliveryRow({
      id: "delivery-1",
      userId: "user-1",
      subscriptionId: "sub-1",
      eventId: "event-1",
      eventType: "case.updated",
      payload: { caseId: "case-1" },
      signature: "signature",
      status: "RETRYING",
      attempt: 2,
      maxAttempts: 5,
      lastStatusCode: 503,
      lastError: "upstream unavailable",
      nextAttemptAt: new Date("2026-09-13T10:00:00.000Z"),
      deliveredAt: null,
      createdAt: new Date("2026-09-13T09:00:00.000Z"),
      updatedAt: new Date("2026-09-13T09:01:00.000Z"),
    });

    expect(mapped).toMatchObject({
      id: "delivery-1",
      state: "RETRYING",
      statusCode: 503,
      lastStatusCode: 503,
      error: "upstream unavailable",
      lastError: "upstream unavailable",
      nextAttemptAt: "2026-09-13T10:00:00.000Z",
      deliveredAt: null,
    });
  });
});
