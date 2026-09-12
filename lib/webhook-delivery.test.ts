import { describe, expect, it } from "vitest";
import {
  WEBHOOK_MAX_ATTEMPTS,
  isRetryableWebhookStatus,
  nextWebhookDeliveryState,
  signWebhookPayload,
  webhookRetryDelayMs,
} from "./webhook-delivery";

describe("webhook delivery policy", () => {
  it("creates the documented deterministic payload signature", () => {
    expect(signWebhookPayload("secret", "{\"id\":1}")).toBe(
      "c1a9f2f0d7f9f7c1c8c7e6d6c8f9f6f1a6d4a9d6c7c1d5d2e2a0e7c0a7c7c5f4",
    );
  });

  it("classifies transient and permanent HTTP failures", () => {
    expect(isRetryableWebhookStatus(429)).toBe(true);
    expect(isRetryableWebhookStatus(503)).toBe(true);
    expect(isRetryableWebhookStatus(400)).toBe(false);
  });

  it("uses bounded exponential backoff", () => {
    expect(webhookRetryDelayMs(1)).toBe(1000);
    expect(webhookRetryDelayMs(3)).toBe(4000);
    expect(webhookRetryDelayMs(99)).toBe(60 * 60 * 1000);
  });

  it("retries transient failures until the attempt limit", () => {
    expect(nextWebhookDeliveryState({ attempt: 1, statusCode: 503 }).state).toBe("RETRYING");
    expect(nextWebhookDeliveryState({ attempt: WEBHOOK_MAX_ATTEMPTS, statusCode: 503 }).state).toBe("FAILED");
    expect(nextWebhookDeliveryState({ attempt: 1, statusCode: 400 }).state).toBe("FAILED");
    expect(nextWebhookDeliveryState({ attempt: 1, statusCode: 204 }).state).toBe("DELIVERED");
  });
});
