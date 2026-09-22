import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { ensureTenant, TENANT_ROLES, type TenantRole } from "@/lib/tenant";
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
export async function auditSecurity(userId: string, action: string, metadata: Prisma.InputJsonValue = {}) {
  const membership = await db.organizationMember.findFirst({
    where: { userId },
    select: { organizationId: true, role: true },
  });

  if (!membership) {
    throw new Error("AUDIT_ACTOR_TENANT_MISSING");
  }

  await db.auditLog.create({
    data: {
      userId,
      action,
      metadata,
      organizationId: membership.organizationId,
      actorRole: membership.role,
    },
  });
}
