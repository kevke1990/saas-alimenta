import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isCaseLockedForCalculation, calculationLockMessage } from "@/lib/case-lock";

const ALLOWED = new Set(["PROPOSED", "APPROVED", "REJECTED"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const contentType = req.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
    const factId = String(body.factId || "");
    const status = String(body.status || "").toUpperCase();
    if (!factId || !ALLOWED.has(status)) return new NextResponse("Ongeldige fact/status", { status: 400 });

    const c = await db.case.findFirst({ where: { id, userId: u.id }, select: { id: true, reviewStatus: true } });
    if (!c) return new NextResponse("Dossier niet gevonden", { status: 404 });
    if (isCaseLockedForCalculation(c.reviewStatus)) {
      return new NextResponse(calculationLockMessage(c.reviewStatus), { status: 409 });
    }

    const fact = await db.incomeFact.findFirst({ where: { id: factId, userId: u.id, caseId: id }, include: { document: true } });
    if (!fact) return new NextResponse("Inkomensfeit niet gevonden", { status: 404 });

    const now = new Date();
    const updated = await db.$transaction(async tx => {
      const nextFact = await tx.incomeFact.update({
        where: { id: fact.id },
        data: { status, approvedAt: status === "APPROVED" ? now : null, approvedByUserId: status === "APPROVED" ? u.id : null },
      });

      // A changed approval decision is a change to the professional data basis.
      // It must invalidate the current review state, but it never recalculates implicitly.
      await tx.case.update({
        where: { id },
        data: { reviewStatus: "INCOMPLETE", reviewedAt: null, approvedAt: null, approvedByUserId: null },
      });

      await tx.auditLog.create({
        data: {
          userId: u.id,
          action: status === "APPROVED" ? "INCOME_FACT_APPROVED" : status === "REJECTED" ? "INCOME_FACT_REJECTED" : "INCOME_FACT_REOPENED",
          metadata: { caseId: id, documentId: fact.documentId, incomeFactId: fact.id, key: fact.key, label: fact.label, valueNumber: fact.valueNumber, confidence: fact.confidence, reviewInvalidated: true },
        },
      });
      return nextFact;
    });

    if (!contentType.includes("application/json")) return NextResponse.redirect(new URL(`/cases/${id}/income-facts`, req.url));
    return NextResponse.json({ ok: true, fact: updated, reviewInvalidated: true });
  } catch (e: any) {
    return new NextResponse(e?.message || "Opslaan mislukt", { status: 400 });
  }
}
