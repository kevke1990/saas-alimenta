import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculationFingerprint } from "@/lib/calculation-snapshot";
import { isCaseLockedForCalculation, calculationLockMessage } from "@/lib/case-lock";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; calculationId: string }> }) {
  try {
    const u = await requireUser();
    const { id, calculationId } = await params;

    const existing = await db.case.findFirst({
      where: { id, userId: u.id, status: { not: "ARCHIVED" } },
      include: {
        calculations: {
          where: { id: calculationId },
          take: 1,
        },
      },
    });

    if (!existing || !existing.calculations[0]) {
      return new NextResponse("Snapshot niet gevonden.", { status: 404 });
    }

    if (isCaseLockedForCalculation(existing.reviewStatus)) {
      return new NextResponse(calculationLockMessage(existing.reviewStatus), { status: 409 });
    }

    const snapshot = existing.calculations[0];
    const inputSnapshot: any = snapshot.inputSnapshot || {};
    const result: any = snapshot.result || {};
    const fingerprint = calculationFingerprint(inputSnapshot, snapshot.engineVersion, snapshot.normVersion);

    await db.$transaction(async (tx) => {
      const updated = await tx.case.update({
        where: { id },
        data: {
          data: inputSnapshot,
          result: { ...result, calculationFingerprint: fingerprint },
          status: "CALCULATED",
          reviewStatus: "INCOMPLETE",
          reviewedAt: null,
          approvedAt: null,
          approvedByUserId: null,
          calculationVersion: snapshot.normVersion,
        },
      });

      const calculation = await tx.calculation.create({
        data: {
          caseId: id,
          engineVersion: snapshot.engineVersion,
          normVersion: snapshot.normVersion,
          inputSnapshot,
          result: { ...result, calculationFingerprint: fingerprint },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: u.id,
          action: "CASE_CALCULATION_RESTORED",
          metadata: {
            caseId: id,
            sourceCalculationId: snapshot.id,
            newCalculationId: calculation.id,
            engineVersion: snapshot.engineVersion,
            normVersion: snapshot.normVersion,
            fingerprint,
            previousReviewStatus: existing.reviewStatus,
          },
        },
      });

      return updated;
    });

    return NextResponse.redirect(new URL(`/cases/${id}`, req.url), 303);
  } catch (e: any) {
    return new NextResponse(e?.message || "Historische berekening herstellen mislukt.", { status: 400 });
  }
}
