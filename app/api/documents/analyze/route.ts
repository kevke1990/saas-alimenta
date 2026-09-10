import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptDocument } from "@/lib/document-store";
import { analyzeDocumentBytes } from "@/lib/document-ai";

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const { documentId } = await req.json();
    const d = await db.document.findFirst({ where: { id: String(documentId || ""), userId: u.id } });
    if (!d) return new NextResponse("Document niet gevonden", { status: 404 });

    const previousAiResult = d.aiResult && typeof d.aiResult === "object" && !Array.isArray(d.aiResult) ? d.aiResult as Record<string, unknown> : {};
    await db.document.update({ where: { id: d.id }, data: { aiStatus: "PROCESSING" } });
    try {
      const result = await analyzeDocumentBytes({ data: decryptDocument(d.storageCipher), mimeType: d.mimeType, name: d.name });
      const aiResult = { ...result, extraction: previousAiResult.extraction ?? null };
      const updated = await db.document.update({ where: { id: d.id }, data: { aiStatus: "COMPLETED", aiResult } });
      await db.auditLog.create({ data: { userId: u.id, action: "DOCUMENT_AI_ANALYZED", metadata: { documentId: d.id, confidence: (result as any)?.confidence ?? null, analysisVersion: result.analysisVersion, model: result.model } } });
      return NextResponse.json({ id: updated.id, aiStatus: updated.aiStatus, aiResult: updated.aiResult });
    } catch (e) {
      await db.document.update({ where: { id: d.id }, data: { aiStatus: "FAILED" } });
      throw e;
    }
  } catch (e: any) {
    return new NextResponse(e?.message || "AI-analyse mislukt", { status: 400 });
  }
}
