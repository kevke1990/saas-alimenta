import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTenantContext, requireTenantRole, createInviteToken } from "@/lib/tenant";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

const ROLES = ["ADMIN", "PROFESSIONAL", "READ_ONLY"] as const;

export async function GET() {
  try {
    const user = await requireUser();
    const tenant = await getTenantContext(user);
    const invites = await db.$queryRaw<Array<{ id: string; email: string; role: string; expiresAt: Date; createdAt: Date }>>(Prisma.sql`SELECT "id", "email", "role", "expiresAt", "createdAt" FROM "OrganizationInvite" WHERE "organizationId" = ${tenant.id} AND "acceptedAt" IS NULL AND "expiresAt" > CURRENT_TIMESTAMP ORDER BY "createdAt" DESC`);
    return NextResponse.json({ invites });
  } catch (e: any) { return new NextResponse(e?.message || "Uitnodigingen ophalen mislukt.", { status: 400 }); }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const tenant = await requireTenantRole(user, ["OWNER", "ADMIN"]);
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const role = String(body?.role || "PROFESSIONAL");
    if (!/^\S+@\S+\.\S+$/.test(email)) return new NextResponse("Ongeldig e-mailadres.", { status: 400 });
    if (!ROLES.includes(role as any)) return new NextResponse("Ongeldige organisatierol.", { status: 400 });
    const { token, tokenHash } = createInviteToken();
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.$executeRaw`INSERT INTO "OrganizationInvite" ("id", "organizationId", "invitedByUserId", "email", "role", "tokenHash", "expiresAt") VALUES (${id}, ${tenant.id}, ${user.id}, ${email}, ${role}, ${tokenHash}, ${expiresAt})`;
    return NextResponse.json({ id, email, role, expiresAt, inviteUrl: `${process.env.APP_URL || ""}/invite/${token}` }, { status: 201 });
  } catch (e: any) { return new NextResponse(e?.message || "Uitnodiging maken mislukt.", { status: 400 }); }
}
