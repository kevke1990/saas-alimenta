import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { requireRuntimeSecret } from "@/lib/runtime-secrets";
import { db } from "@/lib/db";
import { createWebhookDeliverySqlStore } from "@/lib/webhook-delivery-sql-store";
import { processWebhookDeliveryBatch } from "@/lib/webhook-worker-orchestrator";
import { assertSafeWebhookUrl } from "@/lib/webhook-target";

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
        const url = await assertSafeWebhookUrl(metadata.url);
        const response = await fetch(url, {
          method: "POST", redirect: "manual",
          headers: { "content-type": "application/json", "x-alimenta-event": delivery.eventType, "x-alimenta-signature": delivery.signature, "x-alimenta-delivery-id": delivery.id },
          body: JSON.stringify(delivery.payload), signal: AbortSignal.timeout(8000),
        });
        return { statusCode: response.status };
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