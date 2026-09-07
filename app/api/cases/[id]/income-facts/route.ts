import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED = new Set(["PROPOSED", "APPROVED", "REJECTED"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const factId = String(body.factId || "");
    const status = String(body.status || "").toUpperCase();
    if (!factId || !ALLOWED.has(status)) return new NextResponse("Ongeldige fact/status", { status: 400 });

    const fact = await db.incomeFact.findFirst({
      where: { id: factId, userId: u.id, caseId: id },
      include: { document: true },
    });
    if (!fact) return new NextResponse("Inkomensfeit niet gevonden", { status: 404 });

    const now = new Date();
    const updated = await db.incomeFact.update({
      where: { id: fact.id },
      data: {
        status,
        approvedAt: status === "APPROVED" ? now : null,
        approvedByUserId: status === "APPROVED" ? u.id : null,
      },
    });

    await db.auditLog.create({
      data: {
        userId: u.id,
        action: status === "APPROVED" ? "INCOME_FACT_APPROVED" : status === "REJECTED" ? "INCOME_FACT_REJECTED" : "INCOME_FACT_REOPENED",
        metadata: {
          caseId: id,
          documentId: fact.documentId,
          incomeFactId: fact.id,
          key: fact.key,
          label: fact.label,
          valueNumber: fact.valueNumber,
          confidence: fact.confidence,
        },
      },
    });

    return NextResponse.json({ ok: true, fact: updated });
  } catch (e: any) {
    return new NextResponse(e?.message || "Opslaan mislukt", { status: 400 });
  }
}
