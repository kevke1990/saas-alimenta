import { createHash } from "node:crypto";

export const WEBHOOK_MAX_ATTEMPTS = 5;

export type WebhookDeliveryState = "PENDING" | "DELIVERED" | "RETRYING" | "FAILED";

export type WebhookDeliveryRecord = {
  eventId: string;
  attempt: number;
  state: WebhookDeliveryState;
  statusCode?: number;
  nextAttemptAt?: string;
  error?: string;
};

/**
 * Creates the signature format used by the public webhook contract.
 * The secret is never included in the returned value.
 */
export function signWebhookPayload(secret: string, payload: string): string {
  return createHash("sha256").update(`${secret}.${payload}`, "utf8").digest("hex");
}

export function isRetryableWebhookStatus(statusCode: number): boolean {
  return statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
}

/** Exponential backoff, bounded to one hour. */
export function webhookRetryDelayMs(attempt: number): number {
  const normalizedAttempt = Math.max(1, Math.floor(attempt));
  return Math.min(60 * 60 * 1000, 1000 * 2 ** (normalizedAttempt - 1));
}

export function nextWebhookDeliveryState(input: {
  attempt: number;
  statusCode?: number;
  error?: string;
}): WebhookDeliveryRecord {
  const attempt = Math.max(1, Math.floor(input.attempt));
  const failedPermanently = attempt >= WEBHOOK_MAX_ATTEMPTS || (input.statusCode !== undefined && !isRetryableWebhookStatus(input.statusCode));
  if (input.statusCode !== undefined && input.statusCode >= 200 && input.statusCode < 300) {
    return { eventId: "", attempt, state: "DELIVERED", statusCode: input.statusCode };
  }
  if (failedPermanently) {
    return { eventId: "", attempt, state: "FAILED", statusCode: input.statusCode, error: input.error };
  }
  return {
    eventId: "",
    attempt,
    state: "RETRYING",
    statusCode: input.statusCode,
    error: input.error,
    nextAttemptAt: new Date(Date.now() + webhookRetryDelayMs(attempt)).toISOString(),
  };
}
