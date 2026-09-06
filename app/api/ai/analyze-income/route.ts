import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { analyzeIncomeDocument } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body:any = await req.json();
    const text = typeof body?.text === "string" ? body.text : "";
    if (text.length < 30 || text.length > 120000) return new NextResponse("Documenttekst ontbreekt of is te lang", { status: 422 });
    // Explicit opt-out: tenant can disable AI processing globally.
    if (process.env.AI_PROCESSING_DISABLED === "true") return new NextResponse("AI-verwerking is uitgeschakeld", { status: 403 });
    const result = await analyzeIncomeDocument(text);
    return NextResponse.json({ ok:true, userId:user.id, result, disclaimer:"AI-extractie is een voorstel. Controleer elk bedrag en elke bron vóór opname in een berekening." });
  } catch (e:any) { return new NextResponse(e?.message || "AI-analyse mislukt", { status: 400 }); }
}
