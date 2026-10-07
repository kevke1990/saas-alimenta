import { NextResponse } from "next/server";
import { requireCaseTenantAccess } from "@/lib/tenant-access";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCalculationPdf } from "@/lib/pdf-report";
import { buildReviewCalculationBinding, isReviewBindingCurrent } from "@/lib/review-binding";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const { id } = await params;
  const access = await requireCaseTenantAccess(user.id, id, "READ_ONLY");
  const record = await db.case.findFirst({
    where: { id, organizationId: access.organizationId },
    include: { client: true, calculations: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!record) return NextResponse.json({ error: "Dossier niet gevonden" }, { status: 404 });
  const calculation = record.calculations[0];

  let isDraft = true;
  if (record.approvedAt && calculation) {
    const approvalAudit = await db.auditLog.findFirst({
      where: { entityType: "CASE", entityId: id, action: "CASE_APPROVED" },
      orderBy: { createdAt: "desc" }
    });

    if (approvalAudit && approvalAudit.metadata) {
      const binding = (approvalAudit.metadata as any).calculationBinding;
      const currentBinding = buildReviewCalculationBinding(calculation as any);
      if (isReviewBindingCurrent(binding, currentBinding)) {
        isDraft = false;
      }
    }
  }

  const result = (calculation?.result || record.result || {}) as Record<string, unknown>;
  const pdf = createCalculationPdf({
    draft: isDraft,
    title: "Merelo – Alimentatieberekening",
    clientName: record.client?.name || undefined,
    caseName: record.name,
    calculationVersion: calculation?.engineVersion || record.calculationVersion,
    normVersion: calculation?.normVersion || "2026.1",
    result,
    professionalName: user.name || user.email,
    practiceName: user.companyName || "Merelo",
  });
  return new NextResponse(pdf as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="alimenta-${record.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
