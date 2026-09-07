import { NextResponse } from "next/server";
import { authenticateApiToken, checkApiEntitlement, enforceApiRateLimit, apiError, recordApiRequest } from "@/lib/integration-api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await authenticateApiToken(request);
  if (!auth) return apiError("Ongeldige API-authenticatie.", 401);
  if (!auth.scopes.includes("cases:read")) return apiError("Scope cases:read vereist.", 403);
  const rate = await enforceApiRateLimit(`api:${auth.user.id}`, auth.user.plan === "FREE" ? 30 : 120);
  if (!rate.allowed) return apiError("Rate limit bereikt.", 429, { "retry-after": "60" });
  const entitlement = await checkApiEntitlement(auth.user.id, auth.user.plan);
  if (!entitlement.allowed) return apiError("Maandelijkse API-limiet bereikt.", 429);
  const url = new URL(request.url);
  const take = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 25)));
  const cases = await import("@/lib/db").then(({ db }) => db.case.findMany({ where: { userId: auth.user.id }, orderBy: { updatedAt: "desc" }, take, select: { id: true, name: true, status: true, reviewStatus: true, calculationVersion: true, normVersionId: true, createdAt: true, updatedAt: true, client: { select: { id: true, name: true, reference: true, email: true } } } }));
  await recordApiRequest(auth.user.id, { endpoint: "/api/v1/cases", method: "GET" });
  return NextResponse.json({ data: cases, pagination: { limit: take, count: cases.length }, apiVersion: "v1" }, { headers: { "x-ratelimit-remaining": String(rate.remaining) } });
}
