import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/secrets";

export type AiConfig = {
  enabled: boolean;
  provider: string;
  model: string;
  baseUrl: string | null;
  apiKey: string | null;
  systemPrompt: string | null;
  temperature: number;
  maxTokens: number;
};

export async function getAiConfig(): Promise<AiConfig> {
  const rows = await db.$queryRaw<any[]>`SELECT "aiEnabled","aiProvider","aiModel","aiBaseUrl","aiApiKeyCipher","aiSystemPrompt","aiTemperature","aiMaxTokens" FROM "AppConfig" WHERE "id"='singleton' LIMIT 1`;
  const row = rows[0];
  return {
    enabled: !!row?.aiEnabled,
    provider: row?.aiProvider ?? "OPENAI",
    model: row?.aiModel ?? "",
    baseUrl: row?.aiBaseUrl ?? null,
    apiKey: row?.aiApiKeyCipher ? decryptSecret(row.aiApiKeyCipher) : null,
    systemPrompt: row?.aiSystemPrompt ?? null,
    temperature: typeof row?.aiTemperature === "number" ? row.aiTemperature : 0.2,
    maxTokens: typeof row?.aiMaxTokens === "number" ? row.aiMaxTokens : 4000,
  };
}
