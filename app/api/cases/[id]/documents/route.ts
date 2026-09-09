import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditSecurity } from "@/lib/team-security";
import { encryptDocumentText, documentSha256 } from "@/lib/document-security";
import { analyzeIncomeDocument } from "@/lib/gemini";
import { AI_INCOME_LIMIT, AI_INCOME_MAX_INPUT_CHARS, AI_INCOME_WINDOW_MS, hashAiInput } from "@/lib/ai-guardrails";
import { distributedRateLimit } from "@/lib/rate-limit";

const allowedMime = new Set(["text/plain", "text/csv", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!c) return new NextResponse("Dossier niet gevonden", { status: 404 });
  const documents = await db.document.findMany({
    where: { caseId: id, userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { incomeFacts: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json({ documents });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: user.id }, select: { id: true, clientId: true } });
  if (!c) return new NextResponse("Dossier niet gevonden", { status: 404 });

  const body: any = await req.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "Document";
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const mimeType = typeof body?.mimeType === "string" && allowedMime.has(body.mimeType) ? body.mimeType : "text/plain";
  const analyze = body?.analyze !== false;
  if (name.length < 2 || name.length > 250) return new NextResponse("Ongeldige documentnaam", { status: 422 });
  if (text.length < 1 || text.length > 500000) return new NextResponse("Documenttekst ontbreekt of is te groot", { status: 422 });

  const document = await db.document.create({
    data: {
      userId: user.id, clientId: c.clientId, caseId: id, name, mimeType,
      sizeBytes: Buffer.byteLength(text, "utf8"), sha256: documentSha256(text),
      storageCipher: encryptDocumentText(text), source: "UPLOAD", aiStatus: analyze ? "QUEUED" : "NOT_ANALYZED",
    },
  });
  await auditSecurity(user.id, "DOCUMENT_UPLOADED", { caseId: id, documentId: document.id, mimeType, sizeBytes: document.sizeBytes });

  if (!analyze) return NextResponse.json({ ok: true, document }, { status: 201 });
  if (text.length < 30) {
    await db.document.update({ where: { id: document.id }, data: { aiStatus: "SKIPPED" } });
    return NextResponse.json({ ok: true, document: { ...document, aiStatus: "SKIPPED" }, disclaimer: "Te weinig tekst voor betrouwbare AI-extractie." }, { status: 201 });
  }
  if (process.env.AI_PROCESSING_DISABLED === "true") {
    await db.document.update({ where: { id: document.id }, data: { aiStatus: "DISABLED" } });
    return NextResponse.json({ ok: true, document: { ...document, aiStatus: "DISABLED" } }, { status: 201 });
  }
  if (text.length > AI_INCOME_MAX_INPUT_CHARS) {
    await db.document.update({ where: { id: document.id }, data: { aiStatus: "TOO_LARGE" } });
    return NextResponse.json({ ok: true, document: { ...document, aiStatus: "TOO_LARGE" }, warning: "AI-analyse overgeslagen: documenttekst is groter dan de analysegrens." }, { status: 201 });
  }

  const rate = await distributedRateLimit(`ai:income:${user.id}`, AI_INCOME_LIMIT, AI_INCOME_WINDOW_MS);
  if (!rate.ok) {
    await db.document.update({ where: { id: document.id }, data: { aiStatus: "RATE_LIMITED" } });
    return new NextResponse("AI-gebruikslimiet bereikt. Het document is wel veilig opgeslagen.", { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  }

  const cfg = await import("@/lib/ai-config").then((m) => m.getAiConfig());
  const model = cfg.enabled && cfg.provider === "GOOGLE_GEMINI" && cfg.model ? cfg.model : process.env.GOOGLE_AI_MODEL || "gemini-2.5-flash";
  const run = await db.aiRun.create({ data: { userId: user.id, caseId: id, documentId: document.id, operation: "ANALYZE_INCOME_DOCUMENT", model, status: "RUNNING", inputHash: hashAiInput(text) } });
  try {
    const result = await analyzeIncomeDocument(text);
    const facts = [
      ["grossAnnual", "Bruto jaarinkomen", result.grossAnnual, "EUR/jaar"],
      ["holidayAllowance", "Vakantiegeld", result.holidayAllowance, "EUR/jaar"],
      ["thirteenthMonth", "13e maand", result.thirteenthMonth, "EUR/jaar"],
      ["ikb", "IKB", result.ikb, "EUR/jaar"],
      ["pensionPremium", "Pensioenpremie", result.pensionPremium, "EUR/jaar"],
      ["taxableIncome", "Belastbaar inkomen", result.taxableIncome, "EUR/jaar"],
      ["netAnnual", "Netto jaarinkomen", result.netAnnual, "EUR/jaar"],
    ].filter(([, , value]) => typeof value === "number" && Number.isFinite(value)) as [string, string, number, string][];
    if (result.personName) facts.push(["personName", "Persoon", 0, "TEXT"]);
    await db.$transaction([
      db.document.update({ where: { id: document.id }, data: { aiStatus: "ANALYZED", aiResult: result, analysisVersion: "income-v1", aiModel: model } }),
      db.aiRun.update({ where: { id: run.id }, data: { status: "SUCCEEDED", output: result, finishedAt: new Date() } }),
      ...facts.map(([key, label, value, unit]) => db.incomeFact.create({ data: { userId: user.id, documentId: document.id, caseId: id, key, label, valueNumber: value, unit, confidence: result.confidence ?? null, status: "PROPOSED" } })),
    ]);
    await auditSecurity(user.id, "DOCUMENT_AI_ANALYZED", { caseId: id, documentId: document.id, aiRunId: run.id, factCount: facts.length });
    const updated = await db.document.findUnique({ where: { id: document.id }, include: { incomeFacts: true } });
    return NextResponse.json({ ok: true, document: updated, disclaimer: "AI-extractie is uitsluitend een voorstel. Elk feit moet professioneel worden gecontroleerd en goedgekeurd." }, { status: 201 });
  } catch (error: any) {
    await db.document.update({ where: { id: document.id }, data: { aiStatus: "FAILED" } });
    await db.aiRun.update({ where: { id: run.id }, data: { status: "FAILED", error: String(error?.message || "AI-fout").slice(0, 2000), finishedAt: new Date() } }).catch(() => undefined);
    await auditSecurity(user.id, "DOCUMENT_AI_FAILED", { caseId: id, documentId: document.id });
    return NextResponse.json({ ok: false, document: { ...document, aiStatus: "FAILED" }, warning: "Het document is veilig opgeslagen, maar de AI-analyse is mislukt." }, { status: 201 });
  }
}
