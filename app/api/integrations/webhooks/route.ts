import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/secrets";

const EVENTS = ["case.created", "case.updated", "case.calculated", "case.approved"];

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db.usageEvent.findMany({ where: { userId: user.id, type: "WEBHOOK_SUBSCRIPTION" }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(rows.map((r) => { const m = (r.metadata || {}) as Record<string, unknown>; return { id: r.id, url: m.url, events: m.events || [], active: m.active !== false, createdAt: r.createdAt, lastStatus: m.lastStatus || null, lastDeliveryAt: m.lastDeliveryAt || null }; }));
  } catch { return new NextResponse("Unauthorized", { status: 401 }); }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const url = String(body.url || "").trim();
    let parsed: URL;
    try { parsed = new URL(url); } catch { return NextResponse.json({ error: "Ongeldige webhook-URL." }, { status: 422 }); }
    if (parsed.protocol !== "https:") return NextResponse.json({ error: "Webhooks moeten HTTPS gebruiken." }, { status: 422 });
    const events = Array.isArray(body.events) ? body.events.filter((e: unknown) => EVENTS.includes(String(e))) : ["case.updated"];
    if (!events.length) return NextResponse.json({ error: "Minimaal één geldig event vereist." }, { status: 422 });

    // Never store a webhook secret in plaintext. It is returned once to the creator.
    const secret = randomBytes(32).toString("base64url");
    const secretCipher = encryptSecret(secret);
    const row = await db.usageEvent.create({ data: { userId: user.id, type: "WEBHOOK_SUBSCRIPTION", units: 1, metadata: { url, events, active: true, secretCipher } } });
    await db.auditLog.create({ data: { userId: user.id, action: "WEBHOOK_CREATED", metadata: { webhookId: row.id, url, events } } });
    return NextResponse.json({ id: row.id, url, events, secret, warning: "Bewaar het webhook secret veilig; het wordt daarna niet opnieuw getoond." }, { status: 201 });
  } catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id ontbreekt." }, { status: 422 });
    const row = await db.usageEvent.findFirst({ where: { id, userId: user.id, type: "WEBHOOK_SUBSCRIPTION" } });
    if (!row) return NextResponse.json({ error: "Webhook niet gevonden." }, { status: 404 });
    const m = (row.metadata || {}) as Record<string, unknown>;
    await db.usageEvent.update({ where: { id }, data: { metadata: { ...m, active: false, revokedAt: new Date().toISOString() } } });
    await db.auditLog.create({ data: { userId: user.id, action: "WEBHOOK_REVOKED", metadata: { webhookId: id } } });
    return NextResponse.json({ revoked: true });
  } catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
}
