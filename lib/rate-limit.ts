import { Prisma } from "@prisma/client";
import { db } from "./db";

const mem = new Map<string, { count: number; reset: number }>();

export function requestKey(req: Request, prefix: string) {
  const forwarded = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || "unknown";
  return `${prefix}:${ip}`;
}

export async function distributedRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);
  const rows = await db.$queryRaw<Array<{ count: number; expiresAt: Date }>>(Prisma.sql`
    INSERT INTO "RateLimitBucket" ("key", "count", "windowAt", "expiresAt", "updatedAt")
    VALUES (${key}, 1, ${now}, ${expiresAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "windowAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${now}
        ELSE "RateLimitBucket"."windowAt"
      END,
      "expiresAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${expiresAt}
        ELSE "RateLimitBucket"."expiresAt"
      END,
      "updatedAt" = ${now}
    RETURNING "count", "expiresAt"
  `);

  const row = rows[0];
  const count = Number(row?.count ?? limit + 1);
  const retryAfter = Math.max(1, Math.ceil(((row?.expiresAt?.getTime() ?? expiresAt.getTime()) - now.getTime()) / 1000));
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfter,
  };
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const e = mem.get(key);
  if (!e || e.reset <= now) {
    mem.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: Math.ceil(windowMs / 1000) };
  }
  e.count++;
  return {
    ok: e.count <= limit,
    remaining: Math.max(0, limit - e.count),
    retryAfter: Math.max(1, Math.ceil((e.reset - now) / 1000)),
  };
}
