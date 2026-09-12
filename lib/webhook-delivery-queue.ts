import { createHash } from "node:crypto";
import { WEBHOOK_MAX_ATTEMPTS, WebhookDeliveryState, webhookRetryDelayMs } from "./webhook-delivery";

export type QueueDelivery = {
  subscriptionId: string;
  eventId: string;
  state: WebhookDeliveryState;
  attempt: number;
  maxAttempts: number;
  nextAttemptAt?: string | null;
};

/** Stable key used by the database unique constraint and worker idempotency checks. */
export function webhookIdempotencyKey(subscriptionId: string, eventId: string): string {
  return createHash("sha256").update(`${subscriptionId}:${eventId}`, "utf8").digest("hex");
}

/** A delivery is claimable only when it is pending/retrying and its retry time has arrived. */
export function isDeliveryDue(delivery: QueueDelivery, now = new Date()): boolean {
  if (delivery.state !== "PENDING" && delivery.state !== "RETRYING") return false;
  if (delivery.attempt >= Math.min(delivery.maxAttempts, WEBHOOK_MAX_ATTEMPTS)) return false;
  if (!delivery.nextAttemptAt) return true;
  return new Date(delivery.nextAttemptAt).getTime() <= now.getTime();
}

/** Compute the next retry timestamp without mutating persisted state. */
export function nextRetryAt(attempt: number, now = new Date()): string {
  return new Date(now.getTime() + webhookRetryDelayMs(attempt)).toISOString();
}

/** Worker-safe transition before an outbound request is made. */
export function markDeliveryAttempt(delivery: QueueDelivery): QueueDelivery {
  return {
    ...delivery,
    attempt: Math.min(delivery.attempt + 1, delivery.maxAttempts),
    state: "RETRYING",
    nextAttemptAt: null,
  };
}
