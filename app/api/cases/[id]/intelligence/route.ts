import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildExplainableIntelligence } from "@/lib/explainable-intelligence";

const totalOf = (result: unknown) => {
  const r = (result || {}) as Record<string, any>;
  for (const path of ["combined.totalMonthlyPayments", "totalMonthlyPayments", "totalPayment"]) {
    const value = path.split(".").reduce((v, k) => v?.[k], r);
    if (Number.isFinite(Number(value))) return Number(value);
  }
  return null;
};

function missingEvidence(data: unknown) {
  const d = (data || {}) as Record<string, any>;
  const missing: string[] = [];
  if (!Array.isArray(d.parents) || d.parents.length < 2) missing.push("Minimaal twee ouders zijn niet volledig vastgelegd.");
  for (const [index, parent] of (Array.isArray(d.parents) ? d.parents : []).entries()) if (!Number.isFinite(Number(parent?.nbi))) missing.push(`Ouder ${index + 1}: NBI ontbreekt.`);
  if (!Array.isArray(d.children) || d.children.length === 0) missing.push("Geen kinderen vastgelegd.");
  for (const [index, child] of (Array.isArray(d.children) ? d.children : []).entries()) if (!Number.isFinite(Number(child?.age))) missing.push(`Kind ${index + 1}: leeftijd ontbreekt.`);
  return missing;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const c = await db.case.findFirst({ where: { id, userId: user.id }, select: { id: true, name: true, reviewStatus: true, data: true, updatedAt: true, normVersionId: true } });
    if (!c) return new NextResponse("Dossier niet gevonden.", { status: 404 });
    const [calculations, facts, documents, activeNorm] = await Promise.all([
      db.calculation.findMany({ where: { caseId: id }, orderBy: { createdAt: "desc" }, take: 2, select: { result: true, normVersion: true, createdAt: true } }),
      db.incomeFact.findMany({ where: { userId: user.id, caseId: id, status: "PROPOSED" }, select: { confidence: true } }),
      db.document.findMany({ where: { userId: user.id, caseId: id, approvedAt: null, aiStatus: { not: "NOT_ANALYZED" } }, select: { aiStatus: true } }),
      db.normVersion.findFirst({ where: { isActive: true }, orderBy: { effectiveFrom: "desc" }, select: { version: true } }),
    ]);
    const lowConfidenceIncomeFacts = facts.filter(f => f.confidence != null && f.confidence < 0.7).length;
    const documentAnalysisErrors = documents.filter(d => ["ERROR", "FAILED", "ANALYSIS_FAILED"].includes(d.aiStatus)).length;
    const signals = buildExplainableIntelligence({
      reviewStatus: c.reviewStatus, calculationCount: calculations.length,
      latestNormVersion: calculations[0]?.normVersion, activeNormVersion: activeNorm?.version,
      proposedIncomeFacts: facts.length, lowConfidenceIncomeFacts, documentsAwaitingReview: documents.length,
      documentAnalysisErrors, missingEvidenceFields: missingEvidence(c.data),
      latestTotalMonthly: totalOf(calculations[0]?.result), previousTotalMonthly: totalOf(calculations[1]?.result),
      latestCalculationAt: calculations[0]?.createdAt, updatedAt: c.updatedAt,
    });
    return NextResponse.json({ caseId: c.id, caseName: c.name, signals, generatedAt: new Date().toISOString(), disclaimer: "Dit zijn uitlegbare werksignalen. Ze zijn geen juridisch oordeel en wijzigen de berekening, norm of reviewstatus niet." });
  } catch (e: any) { return new NextResponse(e?.message || "Intelligence mislukt.", { status: 400 }); }
}
