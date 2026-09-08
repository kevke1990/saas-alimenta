import { describe, expect, it } from "vitest";
import {
  AI_INCOME_LIMIT,
  AI_INCOME_MAX_INPUT_CHARS,
  AI_INCOME_MAX_OUTPUT_TOKENS,
  AI_INCOME_TIMEOUT_MS,
  hashAiInput,
  parseAiJson,
} from "./ai-guardrails";

describe("AI guardrails", () => {
  it("keeps conservative income-analysis limits", () => {
    expect(AI_INCOME_LIMIT).toBe(10);
    expect(AI_INCOME_MAX_INPUT_CHARS).toBe(120_000);
    expect(AI_INCOME_TIMEOUT_MS).toBe(20_000);
    expect(AI_INCOME_MAX_OUTPUT_TOKENS).toBe(4_000);
  });

  it("hashes the exact input deterministically", () => {
    expect(hashAiInput("abc")).toBe(hashAiInput("abc"));
    expect(hashAiInput("abc")).not.toBe(hashAiInput("abd"));
    expect(hashAiInput("abc")).toHaveLength(64);
  });

  it("parses plain JSON and fenced JSON", () => {
    expect(parseAiJson<{ value: number }>("{\"value\":1}").value).toBe(1);
    expect(parseAiJson<{ value: number }>("```json\n{\"value\":2}\n```").value).toBe(2);
  });

  it("rejects non-object AI output", () => {
    expect(() => parseAiJson("[]")).toThrow();
    expect(() => parseAiJson("null")).toThrow();
  });
});
