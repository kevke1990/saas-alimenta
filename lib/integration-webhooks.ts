import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/secrets";
import { createWebhookDeliverySqlStore } from "@/lib/webhook-delivery-sql-store";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatcher";
import { assertSafeWebhookUrl } from "@/lib/webhook-target";
export type IntegrationEvent = "case.created" | "case.updated" | "case.calculated" | "case.approved";

export async function emitIntegrationEvent(userId: string, event: IntegrationEvent, data: Record<string, unknown>) {
  const rows = await db.usageEvent.findMany({ where: { userId, type: "WEBHOOK_SUBSCRIPTION" } });
  const subscriptions = [];
  for (const row of rows) {
    const metadata = (row.metadata || {}) as Record<string, unknown>;
    if (metadata.active === false || !Array.isArray(metadata.events) || !metadata.events.includes(event)) continue;
    if (typeof metadata.url !== "string" || typeof metadata.secretCipher !== "string") continue;
    await assertSafeWebhookUrl(metadata.url);
    const secret = decryptSecret(metadata.secretCipher);
    subscriptions.push({ id: row.id, userId, secret });
  }

  if (!subscriptions.length) return { enqueued: 0 };
  const store = createWebhookDeliverySqlStore(db);
  const result = await dispatchWebhookEvent(store, {
    event: {
      eventId: crypto.randomUUID(),
      eventType: event,
      occurredAt: new Date().toISOString(),
      payload: data,
    },
    subscriptions,
  });
  return { enqueued: result.enqueued };
}
