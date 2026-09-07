import { NextResponse } from "next/server";
import { authenticateApiToken, checkApiEntitlement, enforceApiRateLimit, apiError, recordApiRequest } from "@/lib/integration-api";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiToken(request);
  if (!auth) return apiError("Ongeldige API-authenticatie.", 401);
  if (!auth.scopes.includes("cases:read")) return apiError("Scope cases:read vereist.", 403);
  const rate = await enforceApiRateLimit(`api:${auth.user.id}`, auth.user.plan === "FREE" ? 30 : 120);
  if (!rate.allowed) return apiError("Rate limit bereikt.", 429, { "retry-after": "60" });
  const entitlement = await checkApiEntitlement(auth.user.id, auth.user.plan);
  if (!entitlement.allowed) return apiError("Maandelijkse API-limiet bereikt.", 429);
  const { id } = await params;
  const item = await db.case.findFirst({ where: { id, userId: auth.user.id }, include: { client: true, calculations: { orderBy: { createdAt: "asc" } }, incomeFacts: { orderBy: { createdAt: "asc" } }, tasks: { orderBy: { createdAt: "asc" } }, overrides: { orderBy: { createdAt: "asc" } } } });
  if (!item) return apiError("Dossier niet gevonden.", 404);
  const exported = { schemaVersion: "1.0", exportedAt: new Date().toISOString(), source: "Alimenta Pro API v1", case: item };
  await recordApiRequest(auth.user.id, { endpoint: "/api/v1/export/cases/[id]", method: "GET", caseId: id });
  return new NextResponse(JSON.stringify(exported, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="alimenta-case-${id}.json"`, "x-ratelimit-remaining": String(rate.remaining) } });
}
