import { WebhookTransport, WebhookWorkerResult, processWebhookDelivery } from "./webhook-delivery-worker";
import { WebhookDeliveryStore } from "./webhook-delivery-repository";

export type WebhookWorkerBatchResult = {
  processed: number;
  delivered: number;
  retrying: number;
  failed: number;
  skipped: number;
  results: Array<{ id: string; result: WebhookWorkerResult }>;
};

export type WebhookWorkerBatchOptions = {
  concurrency?: number;
  now?: Date;
};

/**
 * Processes an explicit set of delivery IDs with bounded concurrency.
 * The caller is responsible for selecting due IDs and scheduling invocations.
 */
export async function processWebhookDeliveryBatch(
  store: WebhookDeliveryStore,
  ids: string[],
  transport: WebhookTransport,
  options: WebhookWorkerBatchOptions = {},
): Promise<WebhookWorkerBatchResult> {
  const concurrency = Math.max(1, Math.min(20, Math.floor(options.concurrency ?? 4)));
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  const results: Array<{ id: string; result: WebhookWorkerResult }> = [];
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= uniqueIds.length) return;
      const id = uniqueIds[index];
      const result = await processWebhookDelivery(store, id, transport, options.now);
      results.push({ id, result });
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, uniqueIds.length) }, () => worker()));

  return {
    processed: results.length,
    delivered: results.filter(({ result }) => result.status === "DELIVERED").length,
    retrying: results.filter(({ result }) => result.status === "RETRYING").length,
    failed: results.filter(({ result }) => result.status === "FAILED").length,
    skipped: results.filter(({ result }) => result.status === "SKIPPED").length,
    results,
  };
}
