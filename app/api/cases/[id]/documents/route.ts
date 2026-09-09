import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditSecurity } from "@/lib/team-security";
import { encryptDocument, sha256, safeDocumentName, MAX_DOCUMENT_BYTES } from "@/lib/document-store";
import { analyzeIncomeDocument } from "@/lib/gemini";
import { AI_INCOME_LIMIT, AI_INCOME_MAX_INPUT_CHARS, AI_INCOME_WINDOW_MS, hashAiInput } from "@/lib/ai-guardrails";
import { distributedRateLimit } from "@/lib/rate-limit";

const allowedMime = new Set(["text/plain", "text/csv", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!c) return new NextResponse("Dossier niet gevonden", { status: 404 });
  return NextResponse.json({ documents: await db.document.findMany({ where: { caseId: id, userId: user.id }, orderBy: { createdAt: "desc" }, include: { incomeFacts: { orderBy: { createdAt: "asc" } } } }) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: user.id }, select: { id: true, clientId: true } });
  if (!c) return new NextResponse("Dossier niet gevonden", { status: 404 });
  const contentType = req.headers.get("content-type") || "";
  const body: any = contentType.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const name = safeDocumentName(typeof body?.name === "string" ? body.name.trim() : "document");
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const mimeType = typeof body?.mimeType === "string" && allowedMime.has(body.mimeType) ? body.mimeType : "text/plain";
  const analyze = body?.analyze !== "false";
  const bytes = Buffer.byteLength(text, "utf8");
  if (name.length < 2 || !text || bytes > MAX_DOCUMENT_BYTES) return new NextResponse("Ongeldig of te groot document", { status: 422 });
  const document = await db.document.create({ data: { userId:user.id, clientId:c.clientId, caseId:id, name, mimeType, sizeBytes:bytes, sha256:sha256(Buffer.from(text)), storageCipher:encryptDocument(Buffer.from(text)), source:"UPLOAD", aiStatus:analyze?"QUEUED":"NOT_ANALYZED" } });
  await auditSecurity(user.id,"DOCUMENT_UPLOADED",{caseId:id,documentId:document.id,mimeType,sizeBytes:bytes});
  if (!analyze) return contentType.includes("application/json") ? NextResponse.json({ok:true,document},{status:201}) : NextResponse.redirect(new URL(`/cases/${id}/documenten`,req.url));
  if (text.length < 30 || text.length > AI_INCOME_MAX_INPUT_CHARS || process.env.AI_PROCESSING_DISABLED === "true") {
    const aiStatus = process.env.AI_PROCESSING_DISABLED === "true" ? "DISABLED" : text.length < 30 ? "SKIPPED" : "TOO_LARGE";
    await db.document.update({where:{id:document.id},data:{aiStatus}});
    return contentType.includes("application/json") ? NextResponse.json({ok:true,document:{...document,aiStatus}},{status:201}) : NextResponse.redirect(new URL(`/cases/${id}/documenten`,req.url));
  }
  const rate = await distributedRateLimit(`ai:income:${user.id}`,AI_INCOME_LIMIT,AI_INCOME_WINDOW_MS);
  if (!rate.ok) { await db.document.update({where:{id:document.id},data:{aiStatus:"RATE_LIMITED"}}); return new NextResponse("AI-limiet bereikt. Het document is veilig opgeslagen.",{status:429,headers:{"Retry-After":String(rate.retryAfter)}}); }
  const cfg = await import("@/lib/ai-config").then(m=>m.getAiConfig());
  const model = cfg.enabled && cfg.provider === "GOOGLE_GEMINI" && cfg.model ? cfg.model : process.env.GOOGLE_AI_MODEL || "gemini-2.5-flash";
  const run = await db.aiRun.create({data:{userId:user.id,caseId:id,documentId:document.id,operation:"ANALYZE_INCOME_DOCUMENT",model,status:"RUNNING",inputHash:hashAiInput(text)}});
  try {
    const result = await analyzeIncomeDocument(text);
    const facts:Array<[string,string,number,string]> = [["grossAnnual","Bruto jaarinkomen",result.grossAnnual,"EUR/jaar"],["holidayAllowance","Vakantiegeld",result.holidayAllowance,"EUR/jaar"],["thirteenthMonth","13e maand",result.thirteenthMonth,"EUR/jaar"],["ikb","IKB",result.ikb,"EUR/jaar"],["pensionPremium","Pensioenpremie",result.pensionPremium,"EUR/jaar"],["taxableIncome","Belastbaar inkomen",result.taxableIncome,"EUR/jaar"],["netAnnual","Netto jaarinkomen",result.netAnnual,"EUR/jaar"]].filter(([, ,v])=>typeof v === "number" && Number.isFinite(v)) as Array<[string,string,number,string]>;
    await db.$transaction([db.document.update({where:{id:document.id},data:{aiStatus:"ANALYZED",aiResult:result,analysisVersion:"income-v1",aiModel:model}}),db.aiRun.update({where:{id:run.id},data:{status:"SUCCEEDED",output:result,finishedAt:new Date()}}),...facts.map(([key,label,value,unit])=>db.incomeFact.create({data:{userId:user.id,documentId:document.id,caseId:id,key,label,valueNumber:value,unit,confidence:result.confidence??null,status:"PROPOSED"}}))]);
    await auditSecurity(user.id,"DOCUMENT_AI_ANALYZED",{caseId:id,documentId:document.id,aiRunId:run.id,factCount:facts.length});
    if (!contentType.includes("application/json")) return NextResponse.redirect(new URL(`/cases/${id}/documenten`,req.url));
    return NextResponse.json({ok:true,document:await db.document.findUnique({where:{id:document.id},include:{incomeFacts:true}}),disclaimer:"AI-extractie is uitsluitend een voorstel. Controleer elk feit professioneel voordat het in een berekening wordt gebruikt."},{status:201});
  } catch(error:any) {
    await db.document.update({where:{id:document.id},data:{aiStatus:"FAILED"}}); await db.aiRun.update({where:{id:run.id},data:{status:"FAILED",error:String(error?.message||"AI-fout").slice(0,2000),finishedAt:new Date()}}).catch(()=>undefined); await auditSecurity(user.id,"DOCUMENT_AI_FAILED",{caseId:id,documentId:document.id});
    if (!contentType.includes("application/json")) return NextResponse.redirect(new URL(`/cases/${id}/documenten`,req.url));
    return NextResponse.json({ok:false,document:{...document,aiStatus:"FAILED"},warning:"Document veilig opgeslagen; AI-analyse mislukt."},{status:201});
  }
}
