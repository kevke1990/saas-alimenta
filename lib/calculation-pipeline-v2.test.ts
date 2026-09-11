import { describe, expect, it } from "vitest";
import { runCalculationEngineV2 } from "./calculation-pipeline-v2";

describe("calculation pipeline v2", () => {
  const input = {
    historicalNBGI: 5000,
    parents: [{ nbi: 3000, careDaysPerWeek: 1 }, { nbi: 3000, careDaysPerWeek: 6 }],
    children: [{ age: 8, residence: "B" as const }],
  };

  it("returns the v2 contract and deterministic fingerprints", () => {
    const a = runCalculationEngineV2(input, "2026.1");
    const b = runCalculationEngineV2({ ...input, parents: [...input.parents].reverse() }, "2026.1");
    expect(a.fingerprint.engineVersion).toBe("2.0.0");
    expect(a.fingerprint.contractVersion).toBe("2026.2");
    expect(a.fingerprint.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(a.fingerprint.resultHash).toMatch(/^[a-f0-9]{64}$/);
    expect(a.ruleEngineVersion).toBe("1.0.0");
    expect(a.fingerprint.inputHash).not.toBe(b.fingerprint.inputHash);
  });

  it("requires an explicit norm version", () => {
    expect(() => runCalculationEngineV2(input, "")).toThrow("normversie");
  });
});
