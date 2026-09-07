import { NextResponse } from "next/server";
import { authenticateApiToken, checkApiEntitlement, enforceApiRateLimit, apiError, recordApiRequest } from "@/lib/integration-api";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await authenticateApiToken(request);
  if (!auth) return apiError("Ongeldige API-authenticatie.", 401);
  if (!auth.scopes.includes("cases:write")) return apiError("Scope cases:write vereist.", 403);
  const rate = await enforceApiRateLimit(`api:${auth.user.id}`, auth.user.plan === "FREE" ? 30 : 120);
  if (!rate.allowed) return apiError("Rate limit bereikt.", 429, { "retry-after": "60" });
  const entitlement = await checkApiEntitlement(auth.user.id, auth.user.plan);
  if (!entitlement.allowed) return apiError("Maandelijkse API-limiet bereikt.", 429);
  const body = await request.json();
  if (body?.schemaVersion !== "1.0" || !body?.case || typeof body.case !== "object") return apiError("Ongeldig importformaat. schemaVersion 1.0 vereist.", 422);
  const source = body.case as Record<string, unknown>;
  if (typeof source.name !== "string" || !source.name.trim()) return apiError("case.name is verplicht.", 422);
  if (!source.data || typeof source.data !== "object") return apiError("case.data is verplicht.", 422);
  const clientSource = source.client as Record<string, unknown> | null;
  const client = clientSource && typeof clientSource.name === "string"
    ? await db.client.create({ data: { userId: auth.user.id, name: String(clientSource.name).slice(0, 200), reference: null, email: typeof clientSource.email === "string" ? clientSource.email : null } })
    : null;
  const created = await db.case.create({ data: { userId: auth.user.id, clientId: client?.id || null, name: String(source.name).slice(0, 200), data: source.data as object, metadata: source.metadata && typeof source.metadata === "object" ? source.metadata as object : undefined, status: "DRAFT", reviewStatus: "INCOMPLETE" } });
  await recordApiRequest(auth.user.id, { endpoint: "/api/v1/import/cases", method: "POST", caseId: created.id });
  await db.auditLog.create({ data: { userId: auth.user.id, action: "API_CASE_IMPORTED", metadata: { caseId: created.id, schemaVersion: "1.0" } } });
  return NextResponse.json({ data: { id: created.id, clientId: client?.id || null }, apiVersion: "v1" }, { status: 201, headers: { "x-ratelimit-remaining": String(rate.remaining) } });
}
