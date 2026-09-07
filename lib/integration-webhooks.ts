import { db } from "@/lib/db";

export type IntegrationEvent = "case.created" | "case.updated" | "case.calculated" | "case.approved";

export async function emitIntegrationEvent(userId: string, event: IntegrationEvent, data: Record<string, unknown>) {
  const rows = await db.usageEvent.findMany({ where: { userId, type: "WEBHOOK_SUBSCRIPTION" } });
  const subscriptions = rows.filter((r) => {
    const m = (r.metadata || {}) as Record<string, unknown>;
    return m.active !== false && Array.isArray(m.events) && m.events.includes(event) && typeof m.url === "string";
  });
  await Promise.allSettled(subscriptions.map(async (r) => {
    const m = r.metadata as Record<string, unknown>;
    const payload = JSON.stringify({ id: crypto.randomUUID(), type: event, createdAt: new Date().toISOString(), data });
    const secret = typeof m.secret === "string" ? m.secret : "";
    const signature = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret + "." + payload));
    const hex = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const response = await fetch(String(m.url), { method: "POST", headers: { "content-type": "application/json", "x-alimenta-event": event, "x-alimenta-signature": `sha256=${hex}` }, body: payload, signal: AbortSignal.timeout(8000) });
    await db.usageEvent.update({ where: { id: r.id }, data: { metadata: { ...m, lastStatus: response.status, lastDeliveryAt: new Date().toISOString() } } });
  }));
}
