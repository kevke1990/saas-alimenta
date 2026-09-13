import { QueueDelivery } from "./webhook-delivery-queue";
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
 *
 * claimDue is an atomic claim operation: the adapter must return the record
 * after it has reserved the delivery and incremented its attempt counter.
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
      // The adapter performs the due check and attempt increment atomically.
      // Re-applying queue policy here would increment attempts twice for SQL stores.
      return store.claimDue({ id, now });
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
