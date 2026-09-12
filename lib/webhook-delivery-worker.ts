import { nextWebhookDeliveryState } from "./webhook-delivery";
import { createWebhookDeliveryRepository, StoredWebhookDelivery, WebhookDeliveryStore } from "./webhook-delivery-repository";

export type WebhookTransportResponse = {
  statusCode: number;
  error?: string;
};

export type WebhookTransport = (delivery: StoredWebhookDelivery) => Promise<WebhookTransportResponse>;

export type WebhookWorkerResult =
  | { status: "SKIPPED"; reason: "NOT_DUE" | "ALREADY_COMPLETE" }
  | { status: "DELIVERED"; attempt: number; statusCode: number }
  | { status: "RETRYING"; attempt: number; nextAttemptAt: string; statusCode?: number }
  | { status: "FAILED"; attempt: number; statusCode?: number; error?: string };

/**
 * Executes one delivery with an injected transport and persistence store.
 * No network or scheduling behavior is hidden here: callers own the worker loop.
 */
export async function processWebhookDelivery(
  store: WebhookDeliveryStore,
  id: string,
  transport: WebhookTransport,
  now = new Date(),
): Promise<WebhookWorkerResult> {
  const repository = createWebhookDeliveryRepository(store);
  const candidate = await store.claimDue({ id, now });
  if (!candidate) return { status: "SKIPPED", reason: "NOT_DUE" };

  const claimed = await repository.claim(id, now);
  if (!claimed) return { status: "SKIPPED", reason: "NOT_DUE" };

  let response: WebhookTransportResponse;
  try {
    response = await transport(claimed);
  } catch (error) {
    response = {
      statusCode: 503,
      error: error instanceof Error ? error.message : "Webhook transport failed",
    };
  }

  const transition = nextWebhookDeliveryState({
    attempt: claimed.attempt,
    statusCode: response.statusCode,
    error: response.error,
  });

  if (transition.state === "DELIVERED") {
    await repository.complete({ id: claimed.id, statusCode: response.statusCode });
    return { status: "DELIVERED", attempt: claimed.attempt, statusCode: response.statusCode };
  }

  const updated = await repository.fail({
    id: claimed.id,
    state: transition.state,
    statusCode: response.statusCode,
    error: response.error,
    nextAttemptAt: transition.nextAttemptAt ?? null,
  });

  if (transition.state === "RETRYING") {
    return {
      status: "RETRYING",
      attempt: claimed.attempt,
      nextAttemptAt: updated.nextAttemptAt ?? transition.nextAttemptAt ?? now.toISOString(),
      statusCode: response.statusCode,
    };
  }

  return {
    status: "FAILED",
    attempt: claimed.attempt,
    statusCode: response.statusCode,
    error: response.error,
  };
}
