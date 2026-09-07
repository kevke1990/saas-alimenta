import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createApiToken, planLimits, hashApiToken } from "@/lib/integration-api";

const ALLOWED = ["cases:read", "cases:write", "clients:read", "clients:write", "webhooks:manage"];

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db.usageEvent.findMany({ where: { userId: user.id, type: "API_CREDENTIAL" }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(rows.map((r) => {
      const m = (r.metadata || {}) as Record<string, unknown>;
      return { id: r.id, name: m.name || "API key", scopes: m.scopes || [], active: m.active !== false, createdAt: r.createdAt };
    }));
  } catch { return new NextResponse("Unauthorized", { status: 401 }); }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const current = await db.usageEvent.count({ where: { userId: user.id, type: "API_CREDENTIAL", metadata: { path: ["active"], equals: true } } });
    if (current >= planLimits[user.plan].keys) return NextResponse.json({ error: "API-key limiet van uw abonnement bereikt." }, { status: 403 });
    const body = await req.json();
    const name = String(body.name || "Integratie").trim().slice(0, 80);
    const scopes = Array.isArray(body.scopes) ? body.scopes.filter((s: unknown) => ALLOWED.includes(String(s))) : ["cases:read"];
    if (!scopes.length) return NextResponse.json({ error: "Minimaal één geldige scope vereist." }, { status: 422 });
    const created = createApiToken();
    const row = await db.usageEvent.create({ data: { userId: user.id, type: "API_CREDENTIAL", units: 1, metadata: { name, scopes, active: true, tokenHash: created.hash, tokenPrefix: created.token.slice(0, 18) } } });
    await db.auditLog.create({ data: { userId: user.id, action: "API_CREDENTIAL_CREATED", metadata: { credentialId: row.id, name, scopes } } });
    return NextResponse.json({ id: row.id, name, scopes, token: created.token, warning: "Bewaar deze token direct. De volledige token wordt daarna niet meer getoond." }, { status: 201 });
  } catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id ontbreekt." }, { status: 422 });
    const row = await db.usageEvent.findFirst({ where: { id, userId: user.id, type: "API_CREDENTIAL" } });
    if (!row) return NextResponse.json({ error: "API-key niet gevonden." }, { status: 404 });
    const m = (row.metadata || {}) as Record<string, unknown>;
    await db.usageEvent.update({ where: { id }, data: { metadata: { ...m, active: false, revokedAt: new Date().toISOString(), tokenHash: hashApiToken(`${String(m.tokenPrefix || "")}revoked`) } } });
    await db.auditLog.create({ data: { userId: user.id, action: "API_CREDENTIAL_REVOKED", metadata: { credentialId: id } } });
    return NextResponse.json({ revoked: true });
  } catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
}
