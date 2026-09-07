import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureTenant, requireTenantRole } from "@/lib/tenant";
import { auditSecurity, getTeam, isTenantRole } from "@/lib/team-security";

export async function GET() {
  try { const user = await requireUser(); return NextResponse.json(await getTeam(user)); }
  catch (e: any) { return new NextResponse(e?.message || "Team ophalen mislukt.", { status: 400 }); }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const tenant = await requireTenantRole(user, ["OWNER", "ADMIN"]);
    const body = await req.json();
    const userId = String(body?.userId || "");
    const role = String(body?.role || "");
    if (!userId || !isTenantRole(role)) return new NextResponse("Ongeldige gebruiker of rol.", { status: 400 });
    if (userId === user.id && role !== "OWNER") return new NextResponse("De eigenaar kan de eigen rol niet hier verlagen.", { status: 400 });
    const target = await db.$queryRaw<Array<{ role: string }>>`SELECT "role" FROM "OrganizationMember" WHERE "organizationId"=${tenant.id} AND "userId"=${userId} LIMIT 1`;
    if (!target[0]) return new NextResponse("Teamlid niet gevonden.", { status: 404 });
    if (role === "OWNER" && tenant.role !== "OWNER") return new NextResponse("Alleen de eigenaar kan een eigenaar aanwijzen.", { status: 403 });
    await db.$executeRaw`UPDATE "OrganizationMember" SET "role"=${role}, "updatedAt"=CURRENT_TIMESTAMP WHERE "organizationId"=${tenant.id} AND "userId"=${userId}`;
    await auditSecurity(user.id, "TEAM_ROLE_CHANGED", { targetUserId: userId, role });
    return NextResponse.json(await getTeam(user));
  } catch (e: any) { return new NextResponse(e?.message || "Teamrol wijzigen mislukt.", { status: 400 }); }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const tenant = await requireTenantRole(user, ["OWNER", "ADMIN"]);
    const body = await req.json(); const userId = String(body?.userId || "");
    if (!userId || userId === user.id) return new NextResponse("Je kunt jezelf niet verwijderen.", { status: 400 });
    const target = await db.$queryRaw<Array<{ role: string }>>`SELECT "role" FROM "OrganizationMember" WHERE "organizationId"=${tenant.id} AND "userId"=${userId} LIMIT 1`;
    if (!target[0]) return new NextResponse("Teamlid niet gevonden.", { status: 404 });
    if (target[0].role === "OWNER") return new NextResponse("De eigenaar kan niet worden verwijderd.", { status: 400 });
    await db.$executeRaw`DELETE FROM "OrganizationMember" WHERE "organizationId"=${tenant.id} AND "userId"=${userId}`;
    await auditSecurity(user.id, "TEAM_MEMBER_REMOVED", { targetUserId: userId });
    return NextResponse.json(await getTeam(user));
  } catch (e: any) { return new NextResponse(e?.message || "Teamlid verwijderen mislukt.", { status: 400 }); }
}
