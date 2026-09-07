import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const TENANT_ROLES = ["OWNER", "ADMIN", "PROFESSIONAL", "READ_ONLY"] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "alimenta";

export async function ensureTenant(user: { id: string; email: string; name?: string | null; companyName?: string | null }) {
  const existing = await db.$queryRaw<Array<{ id: string; name: string; slug: string; role: string }>>(Prisma.sql`SELECT o."id", o."name", o."slug", m."role" FROM "OrganizationMember" m JOIN "Organization" o ON o."id" = m."organizationId" WHERE m."userId" = ${user.id} LIMIT 1`);
  if (existing[0]) return existing[0];

  const organizationId = randomUUID();
  const memberId = randomUUID();
  const baseName = user.companyName?.trim() || `${user.name?.trim() || user.email.split("@")[0]}'s praktijk`;
  const baseSlug = slugify(baseName);
  const slug = `${baseSlug}-${randomBytes(3).toString("hex")}`;
  await db.$transaction(async tx => {
    await tx.$executeRaw(Prisma.sql`INSERT INTO "Organization" ("id", "name", "slug", "updatedAt") VALUES (${organizationId}, ${baseName}, ${slug}, CURRENT_TIMESTAMP)`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role", "updatedAt") VALUES (${memberId}, ${organizationId}, ${user.id}, 'OWNER', CURRENT_TIMESTAMP)`);
  });
  return { id: organizationId, name: baseName, slug, role: "OWNER" };
}

export async function getTenantContext(user: { id: string; email: string; name?: string | null; companyName?: string | null }) {
  return ensureTenant(user);
}

export async function requireTenantRole(user: { id: string; email: string; name?: string | null; companyName?: string | null }, allowed: readonly TenantRole[]) {
  const tenant = await ensureTenant(user);
  if (!allowed.includes(tenant.role as TenantRole)) throw new Error("Onvoldoende organisatierechten.");
  return tenant;
}

export function createInviteToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: createHash("sha256").update(token).digest("hex") };
}
