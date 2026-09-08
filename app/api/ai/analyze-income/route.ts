import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditSecurity } from "@/lib/team-security";
import { distributedRateLimit } from "@/lib/rate-limit";
import {
  AI_INCOME_LIMIT,
  AI_INCOME_MAX_INPUT_CHARS,
  AI_INCOME_WINDOW_MS,
  hashAiInput,
} from "@/lib/ai-guardrails";
import { analyzeIncomeDocument } from "@/lib/gemini";

const genericFailure = "AI-analyse mislukt. Probeer het later opnieuw.";

export async function POST(req: Request) {
  let userId: string | null = null;
  let aiRunId: string | null = null;

  try {
    const user = await requireUser();
    userId = user.id;

    const body: any = await req.json();
    const text = typeof body?.text === "string" ? body.text : "";
    if (text.length < 30 || text.length > AI_INCOME_MAX_INPUT_CHARS) {
      return new NextResponse("Documenttekst ontbreekt of is te lang", { status: 422 });
    }

    if (process.env.AI_PROCESSING_DISABLED === "true") {
      return new NextResponse("AI-verwerking is uitgeschakeld", { status: 403 });
    }

    const rate = await distributedRateLimit(
      `ai:income:${user.id}`,
      AI_INCOME_LIMIT,
      AI_INCOME_WINDOW_MS,
    );
    if (!rate.ok) {
      return new NextResponse("AI-gebruikslimiet bereikt. Probeer het later opnieuw.", {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      });
    }

    const config = await import("@/lib/ai-config").then((m) => m.getAiConfig());
    const model = config.enabled && config.provider === "GOOGLE_GEMINI" && config.model
      ? config.model
      : process.env.GOOGLE_AI_MODEL || "gemini-2.5-flash";
    const inputHash = hashAiInput(text);

    const run = await db.aiRun.create({
      data: {
        userId: user.id,
        operation: "ANALYZE_INCOME",
        model,
        status: "RUNNING",
        inputHash,
      },
    });
    aiRunId = run.id;
    await auditSecurity(user.id, "AI_ANALYSIS_STARTED", { operation: "ANALYZE_INCOME", model });

    const result = await analyzeIncomeDocument(text);

    await db.aiRun.update({
      where: { id: run.id },
      data: { status: "SUCCEEDED", output: result, finishedAt: new Date() },
    });
    await auditSecurity(user.id, "AI_ANALYSIS_COMPLETED", { operation: "ANALYZE_INCOME", model });

    return NextResponse.json({
      ok: true,
      result,
      disclaimer: "AI-extractie is een voorstel. Controleer elk bedrag en elke bron vóór opname in een berekening.",
    });
  } catch (e: any) {
    const message = e?.message || genericFailure;

    if (aiRunId) {
      await db.aiRun.update({
        where: { id: aiRunId },
        data: {
          status: message.includes("te lang") ? "TIMEOUT" : "FAILED",
          error: String(message).slice(0, 2000),
          finishedAt: new Date(),
        },
      }).catch(() => undefined);
    }

    if (userId) {
      await auditSecurity(userId, "AI_ANALYSIS_FAILED", {
        operation: "ANALYZE_INCOME",
        reason: message.includes("te lang") ? "TIMEOUT" : "ERROR",
      }).catch(() => undefined);
    }

    const status = message.includes("limiet") ? 429 : message.includes("uitgeschakeld") ? 403 : 400;
    return new NextResponse(status === 400 ? genericFailure : message, { status });
  }
}
