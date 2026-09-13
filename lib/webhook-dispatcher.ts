import { createWebhookEventEnvelope, type WebhookEventEnvelope } from "./webhook-event-envelope";
import type { StoredWebhookDelivery, WebhookDeliveryStore } from "./webhook-delivery-repository";

export type WebhookSubscriptionTarget = {
  id: string;
  userId: string;
  url: string;
  secret?: string | null;
  eventTypes: string[];
  active: boolean;
};

export type DispatchWebhookEventInput = {
  eventId: string;
  eventType: string;
  occurredAt?: string;
  data: unknown;
};

export type DispatchWebhookEventResult = {
  envelope: WebhookEventEnvelope;
  enqueued: string[];
  skipped: string[];
};

function isAllowedTarget(subscription: WebhookSubscriptionTarget, eventType: string) {
  return subscription.active && subscription.eventTypes.includes(eventType);
}

/**
 * Converts one domain event into durable delivery records. Persistence and
 * transport remain separate: this function only performs filtering and enqueueing.
 */
export async function dispatchWebhookEvent(
  input: DispatchWebhookEventInput,
  subscriptions: WebhookSubscriptionTarget[],
  store: Pick<WebhookDeliveryStore, "insertIfAbsent">,
): Promise<DispatchWebhookEventResult> {
  const envelope = createWebhookEventEnvelope({
    id: input.eventId,
    type: input.eventType,
    occurredAt: input.occurredAt,
    data: input.data,
  });
  const enqueued: string[] = [];
  const skipped: string[] = [];

  for (const subscription of subscriptions) {
    if (!isAllowedTarget(subscription, input.eventType)) {
      skipped.push(subscription.id);
      continue;
    }

    const record: Omit<StoredWebhookDelivery, "id"> = {
      userId: subscription.userId,
      subscriptionId: subscription.id,
      eventId: envelope.id,
      eventType: envelope.type,
      url: subscription.url,
      payload: envelope,
      signature: "",
      state: "PENDING",
      attempt: 0,
      maxAttempts: 5,
      nextAttemptAt: null,
      statusCode: null,
      lastStatusCode: null,
      error: null,
      lastError: null,
      deliveredAt: null,
      createdAt: envelope.occurredAt,
      updatedAt: envelope.occurredAt,
    };
    const stored = await store.insertIfAbsent(record);
    enqueued.push(stored.id);
  }

  return { envelope, enqueued, skipped };
}
