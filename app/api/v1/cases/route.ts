import {
  authenticateApiToken,
  checkApiEntitlement,
  enforceApiRateLimit,
  apiError,
  getRequestId,
  rateLimitHeaders,
  recordApiRequest,
} from "@/lib/integration-api";
import { apiListResponse } from "@/lib/api-list-response";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const baseHeaders = { "x-request-id": requestId };
  const auth = await authenticateApiToken(request);
  if (!auth) return apiError("Ongeldige API-authenticatie.", 401, baseHeaders);
  if (!auth.scopes.includes("cases:read")) return apiError("Scope cases:read vereist.", 403, baseHeaders);

  const limit = auth.user.plan === "FREE" ? 30 : 120;
  const rate = await enforceApiRateLimit(`api:${auth.user.id}`, limit);
  const headers = { ...baseHeaders, ...rateLimitHeaders(rate.limit, rate.remaining, rate.allowed ? undefined : rate.retryAfterSeconds) };
  if (!rate.allowed) return apiError("Rate limit bereikt.", 429, headers);

  const entitlement = await checkApiEntitlement(auth.user.id, auth.user.plan);
  if (!entitlement.allowed) return apiError("Maandelijkse API-limiet bereikt.", 429, headers);

  const url = new URL(request.url);
  const take = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 25)));
  const cases = await import("@/lib/db").then(({ db }) =>
    db.case.findMany({
      where: { userId: auth.user.id },
      orderBy: { updatedAt: "desc" },
      take: take + 1,
      select: {
        id: true,
        name: true,
        status: true,
        reviewStatus: true,
        calculationVersion: true,
        normVersionId: true,
        createdAt: true,
        updatedAt: true,
        client: { select: { id: true, name: true, reference: true, email: true } },
      },
    }),
  );

  await recordApiRequest(auth.user.id, { endpoint: "/api/v1/cases", method: "GET", requestId });
  const response = apiListResponse(cases, take, (item) => item.id, requestId);
  Object.entries(rateLimitHeaders(rate.limit, rate.remaining)).forEach(([key, value]) => response.headers.set(key, String(value)));
  return response;
}
