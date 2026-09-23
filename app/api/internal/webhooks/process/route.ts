import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Agent } from "undici";
import { requireRuntimeSecret } from "@/lib/runtime-secrets";
import { db } from "@/lib/db";
import { createWebhookDeliverySqlStore } from "@/lib/webhook-delivery-sql-store";
import { processWebhookDeliveryBatch } from "@/lib/webhook-worker-orchestrator";
import { assertSafeWebhookUrl } from "@/lib/webhook-target";
import { webhookRequestBody } from "@/lib/webhook-request";

function authorized(request: Request) {
  const supplied = request.headers.get("authorization") || "";
  if (!supplied.startsWith("Bearer ")) return false;
  const expected = requireRuntimeSecret("WEBHOOK_WORKER_SECRET");
  const actual = supplied.slice(7).trim();
  const a = createHash("sha256").update(actual).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    if (!authorized(request)) return new NextResponse("Unauthorized", { status: 401 });
    const rows = await db.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "WebhookDelivery"
      WHERE "status" IN ('PENDING', 'RETRYING')
        AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= CURRENT_TIMESTAMP)
        AND "attempt" < "maxAttempts"
      ORDER BY "createdAt" ASC LIMIT 50`;
    if (!rows.length) return NextResponse.json({ processed: 0, delivered: 0, retrying: 0, failed: 0 });
    const store = createWebhookDeliverySqlStore(db);
    const result = await processWebhookDeliveryBatch(store, rows.map((row) => row.id), async (delivery) => {
      const subscription = await db.usageEvent.findFirst({ where: { id: delivery.subscriptionId, type: "WEBHOOK_SUBSCRIPTION" } });
      const metadata = (subscription?.metadata || {}) as Record<string, unknown>;
      if (metadata.active === false || typeof metadata.url !== "string") return { statusCode: 410, error: "Webhook subscription inactive" };
      try {
        const target = await assertSafeWebhookUrl(metadata.url);
        const dispatcher = new Agent({
          connect: {
            lookup: (_hostname, options, callback) => {
              if (options?.all) callback(null, [{ address: target.address, family: target.family }]);
              else callback(null, target.address, target.family);
            },
          },
        });
        try {
          const response = await fetch(target.url, {
            method: "POST", redirect: "manual", dispatcher,
            headers: { "content-type": "application/json", "x-alimenta-event": delivery.eventType, "x-alimenta-signature": delivery.signature, "x-alimenta-delivery-id": delivery.id },
            body: webhookRequestBody(delivery.payload), signal: AbortSignal.timeout(8000),
          } as RequestInit & { dispatcher: Agent });
          await response.body?.cancel();
          return { statusCode: response.status };
        } finally {
          await dispatcher.close();
        }
      } catch (error) {
        return { statusCode: 503, error: error instanceof Error ? error.message : "Webhook transport failed" };
      }
    }, { concurrency: 4 });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === "MissingRuntimeSecretError") return new NextResponse("Webhook worker is not configured", { status: 503 });
    return new NextResponse("Webhook worker failed", { status: 500 });
  }
}
