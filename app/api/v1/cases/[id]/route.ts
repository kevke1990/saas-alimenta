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
  const item = await db.case.findFirst({ where: { id, userId: auth.user.id }, include: { client: true, calculations: { orderBy: { createdAt: "desc" }, take: 1 }, incomeFacts: { orderBy: { createdAt: "desc" } }, tasks: { orderBy: { createdAt: "desc" } } } });
  if (!item) return apiError("Dossier niet gevonden.", 404);
  await recordApiRequest(auth.user.id, { endpoint: "/api/v1/cases/[id]", method: "GET", caseId: id });
  return NextResponse.json({ data: item, apiVersion: "v1" }, { headers: { "x-ratelimit-remaining": String(rate.remaining) } });
}
