import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireCaseTenantAccess, requireClientTenantAccess } from "@/lib/tenant-access";
import { calculationLockMessage, isCaseLockedForCalculation } from "@/lib/case-lock";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const d = await db.document.findFirst({ where: { id } });
    if (!d) return new NextResponse("Document niet gevonden", { status: 404 });

    let organizationId: string | undefined;
    if (d.caseId) {
      const access = await requireCaseTenantAccess(u.id, d.caseId, "PROFESSIONAL");
      organizationId = access.organizationId;
      const c = await db.case.findUnique({ where: { id: d.caseId }, select: { reviewStatus: true } });
      if (c && isCaseLockedForCalculation(c.reviewStatus)) {
        return new NextResponse(calculationLockMessage(c.reviewStatus), { status: 409 });
      }
    } else if (d.clientId) {
      const access = await requireClientTenantAccess(u.id, d.clientId, "PROFESSIONAL");
      organizationId = access.organizationId;
    } else if (d.userId !== u.id) {
      return new NextResponse("Geen toegang tot document", { status: 403 });
    }

    const body: any = await req.json().catch(() => ({}));
    const result = body.result ?? d.aiResult;
    if (!result) return new NextResponse("Geen AI-resultaat om te accorderen", { status: 409 });
    const parentIndex = body.parentIndex === 0 || body.parentIndex === 1 ? Number(body.parentIndex) : d.parentIndex;
    const now = new Date();

    await db.$transaction(async (tx) => {
      await tx.document.update({
        where: { id },
        data: {
          approvedAt: now,
          approvedByUserId: u.id,
          approvedResult: result,
          ...(parentIndex === 0 || parentIndex === 1 ? { parentIndex } : {}),
        },
      });
      await tx.incomeFact.updateMany({
        where: { documentId: id },
        data: {
          status: "APPROVED",
          approvedAt: now,
          approvedByUserId: u.id,
          ...(parentIndex === 0 || parentIndex === 1 ? { parentIndex } : {}),
        },
      });
      if (d.caseId) {
        await tx.case.update({
          where: { id: d.caseId },
          data: { reviewStatus: "INCOMPLETE", reviewedAt: null, approvedAt: null, approvedByUserId: null },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: u.id,
          organizationId: organizationId ?? null,
          action: "DOCUMENT_AI_APPROVED",
          metadata: { documentId: id, caseId: d.caseId },
        },
      });
    });

    return NextResponse.json({ ok: true, approvedAt: now });
  } catch (e: any) {
    return new NextResponse(e?.message || "Accorderen mislukt", {
      status: e?.message === "UNAUTHORIZED" ? 401 : e?.status === 403 ? 403 : 400,
    });
  }
}
