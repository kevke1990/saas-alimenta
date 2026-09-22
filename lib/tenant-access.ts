import { Prisma } from "@prisma/client";
import { db } from "./db";
import { assertTenantRole, type TenantRole } from "./tenant";

export class AuthorizationError extends Error {
  readonly status: 403;
  constructor(message = "Toegang tot deze bron is niet toegestaan.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export type TenantCaseAccess = {
  caseId: string;
  ownerUserId: string;
  organizationId: string;
  role: TenantRole;
};

export async function requireCaseTenantAccess(userId: string, caseId: string, minimumRole: TenantRole = "READ_ONLY") {
  const rows = await db.$queryRaw<Array<{ caseId: string; ownerUserId: string; organizationId: string; role: string }>>(Prisma.sql`
    SELECT c."id" AS "caseId", c."userId" AS "ownerUserId", c."organizationId", requester."role"
    FROM "Case" c
    JOIN "OrganizationMember" requester
      ON requester."organizationId" = c."organizationId"
     AND requester."userId" = ${userId}
    WHERE c."id" = ${caseId}
      AND c."organizationId" IS NOT NULL
      AND c."deletedAt" IS NULL
    LIMIT 1
  `);
  const access = rows[0];
  if (!access) throw new AuthorizationError();
  try {
    assertTenantRole(access.role, minimumRole);
  } catch {
    throw new AuthorizationError("Onvoldoende organisatierechten voor dit dossier.");
  }
  return access as TenantCaseAccess;
}

export async function requireClientTenantAccess(userId: string, clientId: string, minimumRole: TenantRole = "READ_ONLY") {
  const rows = await db.$queryRaw<Array<{ clientId: string; ownerUserId: string; organizationId: string; role: string }>>(Prisma.sql`
    SELECT c."id" AS "clientId", c."userId" AS "ownerUserId", c."organizationId", requester."role"
    FROM "Client" c
    JOIN "OrganizationMember" requester
      ON requester."organizationId" = c."organizationId"
     AND requester."userId" = ${userId}
    WHERE c."id" = ${clientId}
      AND c."organizationId" IS NOT NULL
      AND c."deletedAt" IS NULL
    LIMIT 1
  `);
  const access = rows[0];
  if (!access) throw new AuthorizationError();
  try {
    assertTenantRole(access.role, minimumRole);
  } catch {
    throw new AuthorizationError("Onvoldoende organisatierechten voor deze cliënt.");
  }
  return access;
}
