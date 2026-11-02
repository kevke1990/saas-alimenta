import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { requireCaseTenantAccess } from "@/lib/tenant-access";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const access = await requireCaseTenantAccess(user.id, id, "PROFESSIONAL");
    const c = await db.case.findFirst({ where: { id, organizationId: access.organizationId }, select: { id: true, reviewStatus: true, calculations: { orderBy: { createdAt: "desc" }, take: 1 } } });
    if (!c) return new NextResponse("Dossier niet gevonden.", { status: 404 });
    let body: any = {};
    try { body = await req.json(); } catch { return new NextResponse("Ongeldige invoer.", { status: 422 }); }
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    if (!comment) return new NextResponse("Een reviewopmerking mag niet leeg zijn.", { status: 422 });
    if (comment.length > 5000) return new NextResponse("Reviewopmerking is te lang.", { status: 422 });

    await db.auditLog.create({
      data: {
        userId: user.id,
        organizationId: access.organizationId,
        entityType: "CASE",
        entityId: id,
        actorRole: access.role,
        action: "CASE_REVIEW_COMMENTED",
        metadata: { caseId: id, calculationId: c.calculations[0]?.id || null, comment },
      },
    });
    if (c.reviewStatus === "INCOMPLETE") {
      await db.case.update({ where: { id }, data: { reviewStatus: "READY_FOR_REVIEW", reviewedAt: null, approvedAt: null, approvedByUserId: null } });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return new NextResponse(e?.message || "Opmerking opslaan mislukt.", { status: e?.message === "UNAUTHORIZED" ? 401 : e?.status === 403 ? 403 : 400 });
  }
}

