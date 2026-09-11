import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireCaseTenantAccess } from "@/lib/tenant-access";
import { decryptDocument } from "@/lib/document-store";
import { analyzeDocumentBytes } from "@/lib/document-ai";
import { buildAiFactProposals, proposalConflicts } from "@/lib/ai-fact-proposals";

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const { documentId } = await req.json();
    const d = await db.document.findFirst({ where: { id: String(documentId || "") } });
    if (!d) return new NextResponse("Document niet gevonden", { status: 404 });

    if (d.caseId) {
      await requireCaseTenantAccess(u.id, d.caseId, "READ_ONLY");
    } else if (d.userId !== u.id) {
      return new NextResponse("Geen toegang tot document", { status: 403 });
    }

    const previousAiResult = d.aiResult && typeof d.aiResult === "object" && !Array.isArray(d.aiResult) ? d.aiResult as Record<string, unknown> : {};
    await db.document.update({ where: { id: d.id }, data: { aiStatus: "PROCESSING" } });
    try {
      const analysis = await analyzeDocumentBytes({ data: decryptDocument(d.storageCipher), mimeType: d.mimeType, name: d.name });
      const proposals = buildAiFactProposals(analysis.result);
      const conflicts = proposalConflicts(proposals);
      const aiResult = { ...analysis, extraction: analysis.result, proposals, conflicts };

      await db.$transaction(async (tx) => {
        await tx.document.update({ where: { id: d.id }, data: { aiStatus: "COMPLETED", aiResult, analysisVersion: analysis.analysisVersion, aiModel: analysis.model } });
        if (proposals.length) {
          await tx.incomeFact.createMany({
            data: proposals.map((p) => ({
              userId: d.userId,
              documentId: d.id,
              caseId: d.caseId,
              key: p.key,
              label: p.label,
              valueNumber: p.valueNumber,
              valueText: p.valueText,
              unit: p.unit,
              confidence: p.confidence,
              page: p.page,
              sourceHint: p.sourceHint,
              status: "PROPOSED",
            })),
          });
        }
        await tx.auditLog.create({ data: { userId: u.id, action: "DOCUMENT_AI_PROPOSALS_CREATED", metadata: { documentId: d.id, caseId: d.caseId, proposalCount: proposals.length, conflicts, analysisVersion: analysis.analysisVersion, model: analysis.model } } });
      });

      return NextResponse.json({ id: d.id, aiStatus: "COMPLETED", aiResult, proposalCount: proposals.length, conflicts });
    } catch (e) {
      await db.document.update({ where: { id: d.id }, data: { aiStatus: "FAILED" } });
      throw e;
    }
  } catch (e: any) {
    return new NextResponse(e?.message || "AI-analyse mislukt", { status: 400 });
  }
}
