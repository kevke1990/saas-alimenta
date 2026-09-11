import crypto from "node:crypto";
import { createPortalToken, verifyPortalToken, type PortalSharePayload } from "./client-portal";
import { db } from "./db";

export type PortalShare = { id: string; caseId: string; expiresAt: Date; revokedAt: Date | null };
const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export async function createPortalShare(caseId: string, userId: string, expiresInHours = 168) {
  const id = crypto.randomUUID();
  const safeHours = Math.min(Math.max(Math.floor(expiresInHours), 1), 720);
  const expiresAt = new Date(Date.now() + safeHours * 60 * 60 * 1000);
  const token = await createPortalToken({ caseId, userId, purpose: "CLIENT_CASE" }, `${safeHours}h`);
  await db.$executeRaw`INSERT INTO "ClientPortalShare" ("id", "caseId", "createdByUserId", "tokenHash", "expiresAt") VALUES (${id}, ${caseId}, ${userId}, ${hashToken(token)}, ${expiresAt})`;
  return { id, token, expiresAt };
}

export async function resolvePortalShare(token: string): Promise<PortalSharePayload & { shareId: string; expiresAt: Date }> {
  const payload = await verifyPortalToken(token);
  const rows = await db.$queryRaw<Array<{ id: string; caseId: string; expiresAt: Date; revokedAt: Date | null }>>`SELECT "id", "caseId", "expiresAt", "revokedAt" FROM "ClientPortalShare" WHERE "tokenHash" = ${hashToken(token)} AND "caseId" = ${payload.caseId} AND "createdByUserId" = ${payload.userId} LIMIT 1`;
  const share = rows[0];
  if (!share || share.revokedAt || share.expiresAt.getTime() <= Date.now()) throw new Error("Cliëntportal-link is verlopen of ingetrokken.");
  await db.$executeRaw`UPDATE "ClientPortalShare" SET "lastAccessedAt" = CURRENT_TIMESTAMP WHERE "id" = ${share.id}`;
  return { ...payload, shareId: share.id, expiresAt: share.expiresAt };
}

export async function revokePortalShare(shareId: string, caseId: string, userId: string) {
  const result = await db.$executeRaw`UPDATE "ClientPortalShare" SET "revokedAt" = CURRENT_TIMESTAMP WHERE "id" = ${shareId} AND "caseId" = ${caseId} AND "createdByUserId" = ${userId} AND "revokedAt" IS NULL`;
  return result > 0;
}
