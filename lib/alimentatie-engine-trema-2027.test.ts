import { describe, expect, it } from "vitest";
import { calculateTrema2027, TREMA_2027_ENGINE_VERSION } from "./alimentatie-engine-trema-2027";

describe("Trema 2027 calculation module", () => {
  const base = {
    referenceYear: 2027 as const,
    ownShareMonthly: 900,
    payer: { id: "A" as const, monthlyNbi: 3500, monthlyKgb: 0, officialCapacityMonthly: 700 },
    recipient: { id: "B" as const, monthlyNbi: 2500, monthlyKgb: 0, officialCapacityMonthly: 300 },
  };

  it("calculates need, capacity and payable amount deterministically", () => {
    const result = calculateTrema2027(base);
    expect(result.engineVersion).toBe(TREMA_2027_ENGINE_VERSION);
    expect(result.maximumContributionMonthly).toBe(700);
    expect(result.payableMonthly).toBe(700);
    expect(result.payerCapacityMonthly).toBe(700);
  });

  it("applies care discount without changing the supplied official capacity", () => {
    const result = calculateTrema2027({ ...base, carePercentage: 25 });
    expect(result.payableMonthly).toBe(475);
  });

  it("rejects a non-2027 input", () => {
    expect(() => calculateTrema2027({ ...base, referenceYear: 2026 as 2027 })).toThrow(/uitsluitend bedoeld/);
  });

  it("rejects missing official capacity instead of falling back to 2026", () => {
    expect(() => calculateTrema2027({ ...base, payer: { ...base.payer, officialCapacityMonthly: Number.NaN } })).toThrow(/officialCapacityMonthly/);
  });
});
