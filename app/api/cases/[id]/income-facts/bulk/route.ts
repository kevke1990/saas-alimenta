import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isCaseLockedForCalculation, calculationLockMessage } from "@/lib/case-lock";

const ALLOWED = new Set(["PROPOSED", "APPROVED", "REJECTED"]);
type Change = { factId?: unknown; status?: unknown; parentIndex?: unknown };

function parseParent(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (parsed !== 0 && parsed !== 1) throw new Error("Ongeldige ouderkeuze");
  return parsed;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json().catch(() => null) as { changes?: Change[] } | null;
    if (!body || !Array.isArray(body.changes) || body.changes.length === 0 || body.changes.length > 250) {
      return NextResponse.json({ error: "changes moet 1 tot 250 wijzigingen bevatten" }, { status: 400 });
    }

    const dossier = await db.case.findFirst({
      where: { id, userId: user.id },
      select: { id: true, reviewStatus: true },
    });
    if (!dossier) return NextResponse.json({ error: "Dossier niet gevonden" }, { status: 404 });
    if (isCaseLockedForCalculation(dossier.reviewStatus)) {
      return NextResponse.json({ error: calculationLockMessage(dossier.reviewStatus) }, { status: 409 });
    }

    const normalized = body.changes.map((change, index) => {
      const factId = String(change.factId || "");
      const status = String(change.status || "").toUpperCase();
      if (!factId || !ALLOWED.has(status)) throw new Error(`Ongeldige wijziging op positie ${index + 1}`);
      const parentIndex = parseParent(change.parentIndex);
      if (status === "APPROVED" && parentIndex === null) {
        throw new Error(`Kies ouder A of B voor wijziging ${index + 1}`);
      }
      return { factId, status, parentIndex };
    });

    const uniqueIds = new Set(normalized.map(change => change.factId));
    if (uniqueIds.size !== normalized.length) {
      return NextResponse.json({ error: "Een inkomensfeit mag maar één keer voorkomen" }, { status: 400 });
    }

    const result = await db.$transaction(async tx => {
      const facts = await tx.incomeFact.findMany({
        where: { id: { in: [...uniqueIds] }, userId: user.id, caseId: id },
      });
      if (facts.length !== normalized.length) throw new Error("Een of meer inkomensfeiten zijn niet gevonden");
      const byId = new Map(facts.map(fact => [fact.id, fact]));
      const now = new Date();
      let changedCount = 0;

      for (const change of normalized) {
        const current = byId.get(change.factId)!;
        const nextParentIndex = change.status === "APPROVED" ? change.parentIndex : current.parentIndex;
        const changed = current.status !== change.status || (change.status === "APPROVED" && current.parentIndex !== nextParentIndex);
        if (!changed) continue;
        await tx.incomeFact.update({
          where: { id: current.id },
          data: {
            status: change.status,
            parentIndex: nextParentIndex,
            approvedAt: change.status === "APPROVED" ? now : null,
            approvedByUserId: change.status === "APPROVED" ? user.id : null,
          },
        });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: change.status === "APPROVED" ? "INCOME_FACT_APPROVED" : change.status === "REJECTED" ? "INCOME_FACT_REJECTED" : "INCOME_FACT_REOPENED",
            metadata: {
              caseId: id,
              incomeFactId: current.id,
              documentId: current.documentId,
              key: current.key,
              label: current.label,
              valueNumber: current.valueNumber,
              confidence: current.confidence,
              parentIndex: nextParentIndex,
              bulk: true,
              reviewInvalidated: true,
            },
          },
        });
        changedCount += 1;
      }

      if (changedCount > 0) {
        await tx.case.update({
          where: { id },
          data: { reviewStatus: "INCOMPLETE", reviewedAt: null, approvedAt: null, approvedByUserId: null },
        });
      }
      return { requested: normalized.length, changed: changedCount };
    });

    return NextResponse.json({ ok: true, ...result, reviewInvalidated: result.changed > 0 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Bulk review mislukt" }, { status: 400 });
  }
}
