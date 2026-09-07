import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import type { Plan } from "@prisma/client";

const PREFIX = "almt_live_";
const LIMITS: Record<Plan, { monthly: number; keys: number }> = {
  FREE: { monthly: 100, keys: 1 },
  PRO: { monthly: 5000, keys: 5 },
  PRACTICE: { monthly: 25000, keys: 20 },
  ENTERPRISE: { monthly: 100000, keys: 100 },
};

export function hashApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createApiToken() {
  const secret = randomBytes(32).toString("base64url");
  return { token: `${PREFIX}${secret}`, hash: hashApiToken(`${PREFIX}${secret}`) };
}

export async function authenticateApiToken(request: Request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token.startsWith(PREFIX)) return null;
  const hash = hashApiToken(token);
  const events = await db.usageEvent.findMany({
    where: { type: "API_CREDENTIAL", metadata: { path: ["tokenHash"], equals: hash } },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  const record = events[0];
  if (!record) return null;
  const meta = (record.metadata || {}) as { active?: boolean; name?: string; scopes?: string[]; tokenHash?: string };
  if (meta.active === false || meta.tokenHash !== hash) return null;
  const user = await db.user.findUnique({ where: { id: record.userId } });
  if (!user || user.lockedAt) return null;
  return { user, credential: record, scopes: meta.scopes || ["cases:read"] };
}

export async function checkApiEntitlement(userId: string, plan: Plan) {
  const since = new Date();
  since.setUTCDate(1); since.setUTCHours(0, 0, 0, 0);
  const used = await db.usageEvent.aggregate({
    where: { userId, type: "API_REQUEST", createdAt: { gte: since } },
    _sum: { units: true },
  });
  const limit = LIMITS[plan].monthly;
  return { allowed: (used._sum.units || 0) < limit, used: used._sum.units || 0, limit };
}

export async function enforceApiRateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);
  const bucket = await db.rateLimitBucket.findUnique({ where: { key } });
  if (!bucket || bucket.expiresAt <= now) {
    await db.rateLimitBucket.upsert({ where: { key }, create: { key, count: 1, windowAt: now, expiresAt }, update: { count: 1, windowAt: now, expiresAt } });
    return { allowed: true, remaining: limit - 1 };
  }
  const updated = await db.rateLimitBucket.updateMany({ where: { key, expiresAt: { gt: now }, count: { lt: limit } }, data: { count: { increment: 1 } } });
  return { allowed: updated.count > 0, remaining: Math.max(0, limit - (bucket.count + (updated.count > 0 ? 1 : 0))) };
}

export function apiError(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

export async function recordApiRequest(userId: string, metadata: Record<string, unknown>) {
  await db.usageEvent.create({ data: { userId, type: "API_REQUEST", units: 1, metadata } });
}

export const planLimits = LIMITS;
