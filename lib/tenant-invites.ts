import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { createInviteToken, assertTenantRole, type TenantRole } from "./tenant";

export async function createTenantInvite(input: {
  organizationId: string;
  invitedByUserId: string;
  email: string;
  role?: TenantRole;
  expiresInHours?: number;
}) {
  const role = input.role ?? "PROFESSIONAL";
  if (role === "OWNER") throw new Error("Een uitnodiging kan geen OWNER-rol toekennen.");
  assertTenantRole(role, "READ_ONLY");
  const { token, tokenHash } = createInviteToken();
  const id = randomUUID();
  const hours = Math.min(Math.max(Math.trunc(input.expiresInHours ?? 72), 1), 168);
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  await db.$executeRaw(Prisma.sql`
    INSERT INTO "OrganizationInvite" ("id", "organizationId", "invitedByUserId", "email", "role", "tokenHash", "expiresAt")
    VALUES (${id}, ${input.organizationId}, ${input.invitedByUserId}, ${input.email.trim().toLowerCase()}, ${role}, ${tokenHash}, ${expiresAt})
  `);
  return { id, token, expiresAt, email: input.email.trim().toLowerCase(), role };
}

export async function acceptTenantInvite(token: string, userId: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return db.$transaction(async tx => {
    const rows = await tx.$queryRaw<Array<{ id: string; organizationId: string; email: string; role: string }>>(Prisma.sql`
      SELECT "id", "organizationId", "email", "role"
      FROM "OrganizationInvite"
      WHERE "tokenHash" = ${tokenHash} AND "acceptedAt" IS NULL AND "expiresAt" > CURRENT_TIMESTAMP
      LIMIT 1
      FOR UPDATE
    `);
    const invite = rows[0];
    if (!invite) throw new Error("Deze uitnodiging is ongeldig of verlopen.");

    const users = await tx.$queryRaw<Array<{ email: string }>>(Prisma.sql`SELECT "email" FROM "User" WHERE "id" = ${userId} LIMIT 1`);
    if (!users[0] || users[0].email.trim().toLowerCase() !== invite.email.trim().toLowerCase()) {
      throw new Error("Deze uitnodiging is voor een ander e-mailadres.");
    }

    const existing = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "OrganizationMember" WHERE "userId" = ${userId} LIMIT 1`);
    if (existing[0]) throw new Error("Deze gebruiker is al lid van een organisatie.");

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role", "updatedAt")
      VALUES (${randomUUID()}, ${invite.organizationId}, ${userId}, ${invite.role}, CURRENT_TIMESTAMP)
    `);
    await tx.$executeRaw(Prisma.sql`UPDATE "OrganizationInvite" SET "acceptedAt" = CURRENT_TIMESTAMP WHERE "id" = ${invite.id}`);
    return { organizationId: invite.organizationId, role: invite.role, email: invite.email };
  });
}
