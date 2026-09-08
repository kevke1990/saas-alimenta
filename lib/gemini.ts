import { getAiConfig } from "@/lib/ai-config";
import { AI_INCOME_MAX_OUTPUT_TOKENS, AI_INCOME_TIMEOUT_MS, parseAiJson } from "@/lib/ai-guardrails";

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
  const cfg = await getAiConfig();
  const configuredGemini = cfg.enabled && cfg.provider === "GOOGLE_GEMINI";
  const key = configuredGemini && cfg.apiKey ? cfg.apiKey : process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("Google AI API key ontbreekt");

  // Configured settings are preferred; environment settings remain a safe fallback.
  const model = configuredGemini && cfg.model ? cfg.model : process.env.GOOGLE_AI_MODEL || "gemini-2.5-flash";
  const systemPrompt = configuredGemini && cfg.systemPrompt
    ? cfg.systemPrompt
    : "Je bent een documentextractie-assistent voor Alimenta Pro, een Nederlandse alimentatie-rekenapplicatie. Analyseer uitsluitend de aangeleverde tekst. Verzin niets. Geef JSON terug volgens dit schema: {documentType,personName,employer,grossAnnual,holidayAllowance,thirteenthMonth,ikb,pensionPremium,taxableIncome,netAnnual,detectedComponents,warnings,confidence}. Bedragen zijn jaarlijkse EUR-bedragen als het document een jaarbedrag geeft; anders null. confidence is 0..1. Markeer ontbrekende of dubbelzinnige gegevens in warnings. Dit is extractie, geen juridisch of fiscaal advies.";
  const prompt = `${systemPrompt}\n\nDOCUMENT:\n${text}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_INCOME_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: configuredGemini ? cfg.temperature : 0,
            responseMimeType: "application/json",
            maxOutputTokens: configuredGemini ? Math.min(cfg.maxTokens, AI_INCOME_MAX_OUTPUT_TOKENS) : AI_INCOME_MAX_OUTPUT_TOKENS,
          },
        }),
        signal: controller.signal,
      },
    );

    const payload: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = typeof payload?.error?.message === "string" ? `: ${payload.error.message}` : "";
      throw new Error(`Gemini API fout (${response.status})${detail}`);
    }

    const out = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || "").join("") || "{}";
    return parseAiJson<GeminiAnalysis>(out);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("AI-analyse duurde te lang en is afgebroken");
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI-analyse duurde te lang en is afgebroken");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
