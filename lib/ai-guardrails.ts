import crypto from "node:crypto";

export const AI_INCOME_LIMIT = 10;
export const AI_INCOME_WINDOW_MS = 60 * 60 * 1000;
export const AI_INCOME_MAX_INPUT_CHARS = 120_000;
export const AI_INCOME_TIMEOUT_MS = 20_000;
export const AI_INCOME_MAX_OUTPUT_TOKENS = 4_000;

export function hashAiInput(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function parseAiJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed: unknown = JSON.parse(cleaned);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI gaf geen geldig JSON-object terug");
  }
  return parsed as T;
}
