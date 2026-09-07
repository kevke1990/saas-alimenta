import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getTenantContext, requireTenantRole } from "@/lib/tenant";

export async function GET() {
  try {
    const user = await requireUser();
    const tenant = await getTenantContext(user);
    return NextResponse.json(tenant);
  } catch (e: any) {
    return new NextResponse(e?.message || "Organisatie ophalen mislukt.", { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const tenant = await requireTenantRole(user, ["OWNER", "ADMIN"]);
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 120) return new NextResponse("Organisatienaam moet 2–120 tekens bevatten.", { status: 400 });
    const { db } = await import("@/lib/db");
    await db.$executeRaw`UPDATE "Organization" SET "name" = ${name}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${tenant.id}`;
    return NextResponse.json({ ...tenant, name });
  } catch (e: any) {
    return new NextResponse(e?.message || "Organisatie wijzigen mislukt.", { status: 400 });
  }
}
