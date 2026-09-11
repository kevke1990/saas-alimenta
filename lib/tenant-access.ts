import { Prisma } from "@prisma/client";
import { db } from "./db";
import { assertTenantRole, type TenantRole } from "./tenant";

export type TenantCaseAccess = {
  caseId: string;
  ownerUserId: string;
  organizationId: string;
  role: TenantRole;
};

/** Authorisation boundary for case-level operations. It checks both tenant
 * membership and the requester's own role, never the dossier owner's role.
 */
export async function requireCaseTenantAccess(userId: string, caseId: string, minimumRole: TenantRole = "READ_ONLY") {
  const rows = await db.$queryRaw<Array<{ caseId: string; ownerUserId: string; organizationId: string; role: string }>>(Prisma.sql`
    SELECT c."id" AS "caseId", c."userId" AS "ownerUserId", requester."organizationId", requester."role"
    FROM "Case" c
    JOIN "OrganizationMember" ownerMember ON ownerMember."userId" = c."userId"
    JOIN "OrganizationMember" requester ON requester."organizationId" = ownerMember."organizationId"
    WHERE c."id" = ${caseId} AND requester."userId" = ${userId}
    LIMIT 1
  `);
  const access = rows[0];
  if (!access) throw new Error("Toegang tot dit dossier is niet toegestaan.");
  assertTenantRole(access.role, minimumRole);
  return access as TenantCaseAccess;
}

export async function requireClientTenantAccess(userId: string, clientId: string, minimumRole: TenantRole = "READ_ONLY") {
  const rows = await db.$queryRaw<Array<{ clientId: string; ownerUserId: string; organizationId: string; role: string }>>(Prisma.sql`
    SELECT c."id" AS "clientId", c."userId" AS "ownerUserId", requester."organizationId", requester."role"
    FROM "Client" c
    JOIN "OrganizationMember" ownerMember ON ownerMember."userId" = c."userId"
    JOIN "OrganizationMember" requester ON requester."organizationId" = ownerMember."organizationId"
    WHERE c."id" = ${clientId} AND requester."userId" = ${userId}
    LIMIT 1
  `);
  const access = rows[0];
  if (!access) throw new Error("Toegang tot deze cliënt is niet toegestaan.");
  assertTenantRole(access.role, minimumRole);
  return access;
}
