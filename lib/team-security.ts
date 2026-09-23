import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { ensureTenant, TENANT_ROLES, type TenantRole } from "./tenant";
import type { Prisma } from "@prisma/client";

export function isTenantRole(value: string): value is TenantRole {
  return (TENANT_ROLES as readonly string[]).includes(value);
}

export async function getTeam(user: { id: string; email: string; name?: string | null; companyName?: string | null }) {
  const tenant = await ensureTenant(user);
  const rows = await db.$queryRaw<Array<{ userId: string; email: string; name: string | null; role: string; joinedAt: Date }>>`
    SELECT m."userId", u."email", u."name", m."role", m."createdAt" AS "joinedAt"
    FROM "OrganizationMember" m JOIN "User" u ON u."id" = m."userId"
    WHERE m."organizationId" = ${tenant.id}
    ORDER BY m."createdAt" ASC`;
  return { tenant, members: rows };
}

export function createInviteSecret() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: createHash("sha256").update(token).digest("hex") };
}

/**
 * Append a security audit event using only server-derived actor/tenant fields.
 * The AuditLog table is append-only at the database boundary (Step 12).
 */
export async function auditSecurity(
  userId: string,
  action: string,
  metadata: Prisma.InputJsonValue = {},
  options: { tx?: Prisma.TransactionClient; organizationId?: string } = {},
) {
  const client = options.tx ?? db;
  const membership = await client.organizationMember.findFirst({
    where: { userId, ...(options.organizationId ? { organizationId: options.organizationId } : {}) },
    select: { organizationId: true, role: true },
  });

  if (!membership) {
    throw new Error("AUDIT_ACTOR_TENANT_MISSING");
  }

  await client.auditLog.create({
    data: {
      userId,
      action,
      metadata,
      organizationId: options.organizationId ?? membership.organizationId,
      actorRole: membership.role,
    },
  });
}

export function withSecurityAudit<T>(
  userId: string,
  action: string,
  metadata: Prisma.InputJsonValue,
  mutation: (tx: Prisma.TransactionClient) => Promise<T>,
  organizationId?: string,
) {
  return db.$transaction(async (tx) => {
    const result = await mutation(tx);
    await auditSecurity(userId, action, metadata, { tx, organizationId });
    return result;
  });
}
