import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "./db";

export const TENANT_ROLES = ["OWNER", "ADMIN", "PROFESSIONAL", "READ_ONLY"] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

const ROLE_RANK: Record<TenantRole, number> = { READ_ONLY: 10, PROFESSIONAL: 20, ADMIN: 30, OWNER: 40 };
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "alimenta";

export async function ensureTenant(user: { id: string; email: string; name?: string | null; companyName?: string | null }) {
  const existing = await db.$queryRaw<Array<{ id: string; name: string; slug: string; role: string }>>(Prisma.sql`SELECT o."id", o."name", o."slug", m."role" FROM "OrganizationMember" m JOIN "Organization" o ON o."id" = m."organizationId" WHERE m."userId" = ${user.id} LIMIT 1`);
  if (existing[0]) return existing[0];
  const organizationId = randomUUID();
  const memberId = randomUUID();
  const baseName = user.companyName?.trim() || `${user.name?.trim() || user.email.split("@")[0]}'s praktijk`;
  const slug = `${slugify(baseName)}-${randomBytes(3).toString("hex")}`;
  await db.$transaction(async tx => {
    await tx.$executeRaw(Prisma.sql`INSERT INTO "Organization" ("id", "name", "slug", "updatedAt") VALUES (${organizationId}, ${baseName}, ${slug}, CURRENT_TIMESTAMP)`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role", "updatedAt") VALUES (${memberId}, ${organizationId}, ${user.id}, 'OWNER', CURRENT_TIMESTAMP)`);
  });
  return { id: organizationId, name: baseName, slug, role: "OWNER" };
}

export async function getTenantContext(user: { id: string; email: string; name?: string | null; companyName?: string | null }) { return ensureTenant(user); }

export async function requireTenantRole(user: { id: string; email: string; name?: string | null; companyName?: string | null }, allowed: readonly TenantRole[]) {
  const tenant = await ensureTenant(user);
  if (!allowed.includes(tenant.role as TenantRole)) throw new Error("Onvoldoende organisatierechten.");
  return tenant;
}

export function assertTenantRole(role: string, minimum: TenantRole) {
  const actual = ROLE_RANK[role as TenantRole];
  if (!actual || actual < ROLE_RANK[minimum]) throw new Error("Onvoldoende organisatierechten.");
  return true;
}

export async function tenantUserIds(organizationId: string) {
  const rows = await db.$queryRaw<Array<{ userId: string }>>(Prisma.sql`SELECT "userId" FROM "OrganizationMember" WHERE "organizationId" = ${organizationId}`);
  return rows.map(row => row.userId);
}

export async function assertSameTenant(userId: string, targetUserId: string) {
  const rows = await db.$queryRaw<Array<{ ok: boolean }>>(Prisma.sql`SELECT EXISTS (SELECT 1 FROM "OrganizationMember" a JOIN "OrganizationMember" b ON b."organizationId" = a."organizationId" WHERE a."userId" = ${userId} AND b."userId" = ${targetUserId}) AS ok`);
  if (!rows[0]?.ok) throw new Error("Toegang tot deze organisatiebron is niet toegestaan.");
}

export function createInviteToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: createHash("sha256").update(token).digest("hex") };
}
