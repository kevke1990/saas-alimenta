import { isDeliveryDue, markDeliveryAttempt, QueueDelivery } from "./webhook-delivery-queue";
import { WebhookDeliveryState } from "./webhook-delivery";

export type StoredWebhookDelivery = QueueDelivery & {
  id: string;
  userId: string;
  payload: unknown;
  signature: string;
  eventType: string;
  statusCode?: number | null;
  lastStatusCode?: number | null;
  error?: string | null;
  lastError?: string | null;
  deliveredAt?: string | null;
};

/**
 * Persistence adapter required by the webhook worker.
 * The adapter is deliberately small so Prisma transactions can implement it
 * without leaking database details into the delivery policy.
 */
export type WebhookDeliveryStore = {
  insertIfAbsent(input: Omit<StoredWebhookDelivery, "id">): Promise<StoredWebhookDelivery>;
  claimDue(input: { id: string; now: Date }): Promise<StoredWebhookDelivery | null>;
  updateResult(input: {
    id: string;
    state: WebhookDeliveryState;
    attempt?: number;
    statusCode?: number;
    error?: string;
    nextAttemptAt?: string | null;
    deliveredAt?: string | null;
  }): Promise<StoredWebhookDelivery>;
};

export function createWebhookDeliveryRepository(store: WebhookDeliveryStore) {
  return {
    enqueue(input: Omit<StoredWebhookDelivery, "id">) {
      return store.insertIfAbsent(input);
    },

    async claim(id: string, now = new Date()) {
      const candidate = await store.claimDue({ id, now });
      if (!candidate || !isDeliveryDue(candidate, now)) return null;
      const claimed = markDeliveryAttempt(candidate);
      return store.updateResult({
        id: candidate.id,
        state: claimed.state,
        attempt: claimed.attempt,
        nextAttemptAt: null,
      });
    },

    complete(input: { id: string; statusCode: number; attempt?: number }) {
      return store.updateResult({
        id: input.id,
        state: "DELIVERED",
        attempt: input.attempt,
        statusCode: input.statusCode,
        deliveredAt: new Date().toISOString(),
        nextAttemptAt: null,
      });
    },

    fail(input: {
      id: string;
      state: "RETRYING" | "FAILED";
      attempt?: number;
      statusCode?: number;
      error?: string;
      nextAttemptAt?: string | null;
    }) {
      return store.updateResult(input);
    },
  };
}
