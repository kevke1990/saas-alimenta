export type GeminiAnalysis = {
  documentType?: string;
  personName?: string;
  employer?: string;
  grossAnnual?: number;
  holidayAllowance?: number;
  thirteenthMonth?: number;
  ikb?: number;
  pensionPremium?: number;
  taxableIncome?: number;
  netAnnual?: number;
  detectedComponents?: string[];
  warnings?: string[];
  confidence?: number;
};

export async function analyzeIncomeDocument(text: string): Promise<GeminiAnalysis> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_AI_API_KEY ontbreekt");
  const model = process.env.GOOGLE_AI_MODEL || "gemini-2.5-flash";
  const prompt = `Je bent een documentextractie-assistent voor Alimenta Pro, een Nederlandse alimentatie-rekenapplicatie. Analyseer uitsluitend de aangeleverde tekst. Verzin niets. Geef JSON terug volgens dit schema: {documentType,personName,employer,grossAnnual,holidayAllowance,thirteenthMonth,ikb,pensionPremium,taxableIncome,netAnnual,detectedComponents,warnings,confidence}. Bedragen zijn jaarlijkse EUR-bedragen als het document een jaarbedrag geeft; anders null. confidence is 0..1. Markeer ontbrekende of dubbelzinnige gegevens in warnings. Dit is extractie, geen juridisch of fiscaal advies.\n\nDOCUMENT:\n${text.slice(0, 120000)}`;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0, responseMimeType: "application/json" } })
  });
  if (!r.ok) throw new Error(`Gemini API fout (${r.status})`);
  const j:any = await r.json();
  const out = j?.candidates?.[0]?.content?.parts?.map((x:any)=>x.text||"").join("") || "{}";
  return JSON.parse(out);
}
