import { describe, expect, it } from "vitest";
import { adaptAlimentaForm2027, calculateAlimenta2027 } from "./alimentatie-engine-adapter-2027";

describe("2027 Alimenta adapter", () => {
  const payload = {
    referenceYear: 2027,
    need: { ownShareMonthly: 900 },
    payer: { monthlyNbi: 3500, monthlyKgb: 0, officialCapacityMonthly: 700 },
    recipient: { monthlyNbi: 2500, monthlyKgb: 0, officialCapacityMonthly: 300 },
  };

  it("adapts and calculates a 2027 payload", () => {
    const result = calculateAlimenta2027(payload);
    expect(result.referenceYear).toBe(2027);
    expect(result.payableMonthly).toBe(700);
  });

  it("requires explicit official 2027 capacity", () => {
    expect(() => adaptAlimentaForm2027({ ...payload, payer: { ...payload.payer, officialCapacityMonthly: undefined } })).toThrow(/officiële 2027-draagkracht/);
  });

  it("does not accept another reference year", () => {
    expect(() => adaptAlimentaForm2027({ ...payload, referenceYear: 2026 })).toThrow(/uitsluitend peiljaar 2027/);
  });
});
