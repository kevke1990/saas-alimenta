import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTenantContext, requireTenantRole } from "@/lib/tenant";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireUser();
    const tenant = await getTenantContext(user);
    const members = await db.$queryRaw<Array<{ id: string; userId: string; email: string; name: string | null; role: string; createdAt: Date }>>(Prisma.sql`SELECT m."id", m."userId", u."email", u."name", m."role", m."createdAt" FROM "OrganizationMember" m JOIN "User" u ON u."id" = m."userId" WHERE m."organizationId" = ${tenant.id} ORDER BY m."createdAt" ASC`);
    return NextResponse.json({ organization: tenant, members });
  } catch (e: any) { return new NextResponse(e?.message || "Leden ophalen mislukt.", { status: 400 }); }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const tenant = await requireTenantRole(user, ["OWNER", "ADMIN"]);
    const body = await req.json();
    const role = String(body?.role || "");
    const memberId = String(body?.memberId || "");
    if (!TENANT_ROLES.includes(role as any) || !memberId) return new NextResponse("Ongeldige rol of memberId.", { status: 400 });
    if (role === "OWNER" && tenant.role !== "OWNER") return new NextResponse("Alleen de eigenaar kan een eigenaar aanwijzen.", { status: 403 });
    const rows = await db.$queryRaw<Array<{ userId: string; role: string }>>(Prisma.sql`SELECT "userId", "role" FROM "OrganizationMember" WHERE "id" = ${memberId} AND "organizationId" = ${tenant.id} LIMIT 1`);
    if (!rows[0]) return new NextResponse("Lid niet gevonden.", { status: 404 });
    if (rows[0].userId === user.id && role !== "OWNER") return new NextResponse("De eigenaar kan zichzelf niet uit de eigenaarrol verwijderen.", { status: 400 });
    await db.$executeRaw`UPDATE "OrganizationMember" SET "role" = ${role}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${memberId} AND "organizationId" = ${tenant.id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return new NextResponse(e?.message || "Rol wijzigen mislukt.", { status: 400 }); }
}

const TENANT_ROLES = ["OWNER", "ADMIN", "PROFESSIONAL", "READ_ONLY"] as const;
