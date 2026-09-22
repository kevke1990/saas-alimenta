import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientSchema } from "@/lib/validation";
import { getClientEntitlement } from "@/lib/entitlements";
import { ensureTenant } from "@/lib/tenant";
import { generateClientNumber } from "@/lib/client-number";

export async function GET() {
  try {
    const u = await requireUser();
    const tenant = await ensureTenant(u);
    return NextResponse.json(await db.client.findMany({
      where: { organizationId: tenant.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }));
  } catch (e: any) {
    return new NextResponse(e?.message === "UNAUTHORIZED" ? "Unauthorized" : e?.message || "Fout", { status: e?.message === "UNAUTHORIZED" ? 401 : 400 });
  }
}

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const tenant = await ensureTenant(u);
    const entitlement = await getClientEntitlement(u.id, u.plan);
    if (!entitlement.allowed) return NextResponse.json({ error: "Dossierlimiet van je abonnement bereikt.", used: entitlement.used, limit: entitlement.limit, upgrade: "/billing" }, { status: 402 });
    const data = clientSchema.parse(await req.json());
    const reference = await generateClientNumber(tenant.id);
    const c = await db.client.create({
      data: {
        ...data,
        reference,
        organizationId: tenant.id,
        createdByUserId: u.id,
        updatedByUserId: u.id,
        userId: u.id,
        email: data.email || null,
      },
    });
    await db.auditLog.create({ data: { userId: u.id, organizationId: tenant.id, actorRole: tenant.role, action: "CLIENT_CREATED", metadata: { clientId: c.id, customerNumber: reference, plan: u.plan } } });
    return NextResponse.json(c);
  } catch (e: any) {
    return new NextResponse(e?.message || "Fout", { status: 400 });
  }
}
