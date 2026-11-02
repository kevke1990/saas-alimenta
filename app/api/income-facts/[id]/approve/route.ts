import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireCaseTenantAccess } from "@/lib/tenant-access";
import { calculationLockMessage, isCaseLockedForCalculation } from "@/lib/case-lock";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const f = await db.incomeFact.findFirst({ where: { id } });
    if (!f) return new NextResponse("Inkomensfeit niet gevonden", { status: 404 });

    let organizationId: string | undefined;
    if (f.caseId) {
      const access = await requireCaseTenantAccess(u.id, f.caseId, "PROFESSIONAL");
      organizationId = access.organizationId;
      const c = await db.case.findUnique({ where: { id: f.caseId }, select: { reviewStatus: true } });
      if (c && isCaseLockedForCalculation(c.reviewStatus)) {
        return new NextResponse(calculationLockMessage(c.reviewStatus), { status: 409 });
      }
    } else if (f.userId !== u.id) {
      return new NextResponse("Geen toegang tot inkomensfeit", { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    const isFormSubmit = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
    const body: any = contentType.includes("application/json")
      ? await req.json().catch(() => ({}))
      : isFormSubmit
        ? Object.fromEntries((await req.formData()).entries())
        : {};
    const parentRaw = body?.parentIndex;
    const parentIndex = parentRaw === 0 || parentRaw === 1 || parentRaw === "0" || parentRaw === "1" ? Number(parentRaw) : f.parentIndex;

    const x = await db.$transaction(async (tx) => {
      const updated = await tx.incomeFact.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedByUserId: u.id,
          ...(parentIndex === 0 || parentIndex === 1 ? { parentIndex } : {}),
        },
      });
      if (f.caseId) {
        await tx.case.update({
          where: { id: f.caseId },
          data: { reviewStatus: "INCOMPLETE", reviewedAt: null, approvedAt: null, approvedByUserId: null },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: u.id,
          organizationId: organizationId ?? null,
          action: "INCOME_FACT_APPROVED",
          metadata: { incomeFactId: id, caseId: f.caseId, parentIndex },
        },
      });
      return updated;
    });

    if (isFormSubmit && f.caseId) {
      return NextResponse.redirect(new URL(`/cases/${f.caseId}/documenten`, req.url), 303);
    }
    return NextResponse.json(x);
  } catch (e: any) {
    return new NextResponse(e?.message || "Accorderen mislukt", {
      status: e?.message === "UNAUTHORIZED" ? 401 : e?.status === 403 ? 403 : 400,
    });
  }
}
