import crypto from "node:crypto";
import { db } from "@/lib/db";

export type AuthTokenType = "EMAIL_VERIFY" | "PASSWORD_RESET";

export function createAuthToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export async function issueAuthToken(userId: string, type: AuthTokenType, ttlMs: number) {
  const { token, tokenHash } = createAuthToken();
  await db.$executeRaw`
    DELETE FROM "AuthToken"
    WHERE "userId" = ${userId} AND "type" = ${type}
  `;
  await db.$executeRaw`
    INSERT INTO "AuthToken" ("id", "userId", "tokenHash", "type", "expiresAt")
    VALUES (${crypto.randomUUID()}, ${userId}, ${tokenHash}, ${type}, ${new Date(Date.now() + ttlMs)})
  `;
  return token;
}

export async function consumeAuthToken(token: string, type: AuthTokenType) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const rows = await db.$queryRaw<Array<{ id: string; userId: string }>>`
    SELECT "id", "userId"
    FROM "AuthToken"
    WHERE "tokenHash" = ${tokenHash}
      AND "type" = ${type}
      AND "usedAt" IS NULL
      AND "expiresAt" > CURRENT_TIMESTAMP
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  const updated = await db.$executeRaw`
    UPDATE "AuthToken"
    SET "usedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${row.id} AND "usedAt" IS NULL
  `;
  if (updated !== 1) return null;
  return row.userId;
}
