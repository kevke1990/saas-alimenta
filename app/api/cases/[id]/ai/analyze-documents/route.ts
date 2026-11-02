import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { requireCaseTenantAccess } from "@/lib/tenant-access";
import { db } from "@/lib/db";
import { decryptDocument } from "@/lib/document-store";
import { analyzeDocumentBytes } from "@/lib/document-ai";
import { distributedRateLimit } from "@/lib/rate-limit";
import { AI_INCOME_LIMIT, AI_INCOME_WINDOW_MS } from "@/lib/ai-guardrails";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const rate = await distributedRateLimit(`ai:batch:${u.id}`, AI_INCOME_LIMIT, AI_INCOME_WINDOW_MS);
    if (!rate.ok) {
      return new NextResponse("AI-gebruikslimiet bereikt. Probeer het later opnieuw.", {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      });
    }
    const { id } = await params;
    const access = await requireCaseTenantAccess(u.id, id, "PROFESSIONAL");
    const c = await db.case.findFirst({ where: { id, organizationId: access.organizationId }, include: { documents: true } });
    if (!c) return new NextResponse("Dossier niet gevonden", { status: 404 });
    const docs = c.documents.filter((d) => d.aiStatus !== "COMPLETED").slice(0, 20);
    const results = [];
    for (const d of docs) {
      const started = new Date();
      try {
        const out = await analyzeDocumentBytes({ data: decryptDocument(d.storageCipher), mimeType: d.mimeType, name: d.name });
        await db.document.update({ where: { id: d.id }, data: { aiStatus: "COMPLETED", aiResult: out.result, analysisVersion: out.analysisVersion, aiModel: out.model } });
        await db.incomeFact.deleteMany({ where: { documentId: d.id, status: "PROPOSED" } });
        const fields = Array.isArray((out.result as any).fields) ? (out.result as any).fields : [];
        const person = String((out.result as any).personName || "").toLowerCase();
        const parentIndex = (c.data as any)?.parents?.findIndex((p: any) => String(p?.name || "").toLowerCase() === person);
        for (const f of fields) {
          if (typeof f.valueNumber !== "number") continue;
          await db.incomeFact.create({
            data: {
              userId: u.id,
              documentId: d.id,
              caseId: c.id,
              parentIndex: parentIndex >= 0 ? parentIndex : null,
              key: String(f.key),
              label: String(f.label),
              valueNumber: f.valueNumber,
              valueText: f.valueText || null,
              unit: f.unit || null,
              confidence: Number(f.confidence) || 0,
              page: Number.isInteger(f.page) ? f.page : null,
              sourceHint: f.sourceHint || null,
            },
          });
        }
        await db.aiRun.create({ data: { userId: u.id, caseId: c.id, documentId: d.id, operation: "DOCUMENT_INCOME_EXTRACTION", model: out.model, status: "COMPLETED", inputHash: d.sha256, output: out.result, startedAt: started, finishedAt: new Date() } });
        results.push({ id: d.id, status: "COMPLETED" });
      } catch (e: any) {
        await db.document.update({ where: { id: d.id }, data: { aiStatus: "FAILED" } });
        await db.aiRun.create({ data: { userId: u.id, caseId: c.id, documentId: d.id, operation: "DOCUMENT_INCOME_EXTRACTION", model: process.env.GOOGLE_AI_MODEL || "unknown", status: "FAILED", inputHash: d.sha256, error: String(e?.message || e), startedAt: started, finishedAt: new Date() } });
        results.push({ id: d.id, status: "FAILED", error: String(e?.message || e) });
      }
    }
    await db.auditLog.create({ data: { userId: u.id, organizationId: access.organizationId, entityType: "CASE", entityId: c.id, actorRole: access.role, action: "CASE_AI_BATCH_ANALYZED", metadata: { caseId: c.id, count: results.length } } });
    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return new NextResponse(e?.message || "AI-analyse mislukt", { status: e?.message === "UNAUTHORIZED" ? 401 : e?.status === 403 ? 403 : 400 });
  }
}

