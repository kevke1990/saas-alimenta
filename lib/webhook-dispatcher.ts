import { normalizeWebhookEvent, WebhookEventEnvelope } from "./webhook-event-envelope";
import { signWebhookPayload } from "./webhook-delivery";
import { StoredWebhookDelivery, WebhookDeliveryStore } from "./webhook-delivery-repository";
import { WEBHOOK_MAX_ATTEMPTS } from "./webhook-delivery";

export type WebhookSubscriptionTarget = {
  id: string;
  userId: string;
  secret: string;
};

export type DispatchWebhookEventInput = {
  event: WebhookEventEnvelope;
  subscriptions: WebhookSubscriptionTarget[];
};

export type DispatchWebhookEventResult = {
  eventId: string;
  enqueued: number;
  deliveries: StoredWebhookDelivery[];
};

/**
 * Converts one domain event into durable, idempotent delivery records.
 * Persistence is injected so the domain layer remains independent of Prisma.
 */
export async function dispatchWebhookEvent(
  store: WebhookDeliveryStore,
  input: DispatchWebhookEventInput,
): Promise<DispatchWebhookEventResult> {
  const deliveries: StoredWebhookDelivery[] = [];
  for (const subscription of input.subscriptions) {
    const normalized = normalizeWebhookEvent(input.event, subscription.id);
    const payload = JSON.stringify({
      id: normalized.eventId,
      type: normalized.eventType,
      occurredAt: normalized.occurredAt,
      data: normalized.payload,
    });
    const delivery = await store.insertIfAbsent({
      subscriptionId: subscription.id,
      eventId: normalized.eventId,
      userId: subscription.userId,
      eventType: normalized.eventType,
      payload,
      signature: signWebhookPayload(subscription.secret, payload),
      state: "PENDING",
      attempt: 0,
      maxAttempts: WEBHOOK_MAX_ATTEMPTS,
      nextAttemptAt: null,
      statusCode: null,
      lastStatusCode: null,
      error: null,
      lastError: null,
      deliveredAt: null,
    });
    deliveries.push(delivery);
  }

  return {
    eventId: input.event.eventId,
    enqueued: deliveries.length,
    deliveries,
  };
}
