import { describe, expect, it } from "vitest";
import { calculate } from "./calculator";

describe("Merelo regression calculations", () => {
  it("keeps the illustrative 2026 historical NBGI separate from current income", () => {
    const result = calculate({
      historicalNBGI: 5752,
      parents: [
        { nbi: 3350, careDaysPerWeek: 1 },
        { nbi: 1686, kgb: 716, careDaysPerWeek: 0 },
      ],
      children: [
        { age: 7, residence: "B" },
        { age: 4, residence: "B" },
      ],
      normYear: 2026,
      calculationDate: "2026-09-25",
    });

    expect(result.historicalCalculation.historicalNBGI).toBe(5752);
    expect(result.historicalCalculation.status).toBe("HISTORICAL_ENTERED");
    expect(result.currentCalculation.parentA_NBI).toBe(3350);
    expect(result.currentCalculation.parentB_NBI).toBe(1686);
    expect(result.currentCalculation.parentB_KGB).toBe(716);
    expect(result.totalNeed).toBe(1318);
    expect(result.parentResults[0].capacity).toBeGreaterThanOrEqual(0);
    expect(result.parentResults[1].capacity).toBeGreaterThanOrEqual(0);
    expect(result.totalCapacity).toBeGreaterThanOrEqual(0);
    expect(result.capacityDeficit).toBeGreaterThanOrEqual(0);
    expect(result.careDiscount.grossCareDiscount).toBeGreaterThanOrEqual(0);
    expect(result.careDiscount.shortfallAdjustment).toBeGreaterThanOrEqual(0);
    expect(result.careDiscount.verifiableCareDiscount).toBeLessThanOrEqual(result.careDiscount.grossCareDiscount);
    expect(result.careDiscount.appliedCareDiscount).toBe(result.careDiscount.verifiableCareDiscount);
    expect(result.transfers.reduce((sum, t) => sum + t.payment, 0)).toBeGreaterThanOrEqual(0);
    expect(result.warnings).not.toContain(expect.stringContaining("Geen historisch NBGI"));
  });

  it("marks an omitted historical NBGI as indicative and never as established", () => {
    const result = calculate({
      parents: [
        { nbi: 3350, careDaysPerWeek: 1 },
        { nbi: 1686, kgb: 716, careDaysPerWeek: 0 },
      ],
      children: [
        { age: 7, residence: "B" },
        { age: 4, residence: "B" },
      ],
      normYear: 2026,
      calculationDate: "2026-09-25",
    });

    expect(result.historicalCalculation.historicalNBGI).toBeNull();
    expect(result.historicalCalculation.fallbackNBGI).toBe(5752);
    expect(result.historicalCalculation.status).toBe("DERIVED_INDICATIVE");
    expect(result.warnings.some(w => w.includes("REVIEW_REQUIRED"))).toBe(true);
    expect(result.warnings.some(w => w.includes("geen vastgesteld historisch NBGI"))).toBe(true);
  });

  it("uses the illustrative 2024 case as a norm-year regression without treating its example payment as a target", () => {
    const result = calculate({
      historicalNBGI: 4683,
      historicalNeed: 1173,
      parents: [
        { nbi: 3682, careDaysPerWeek: 1 },
        { nbi: 2235, careDaysPerWeek: 0 },
      ],
      children: [
        { age: 7, residence: "B" },
        { age: 4, residence: "B" },
      ],
      normYear: 2024,
      calculationDate: "2024-09-25",
    });

    expect(result.normYear).toBe(2024);
    expect(result.normVersion).toBe("2024.1");
    expect(result.historicalCalculation.historicalNBGI).toBe(4683);
    expect(result.historicalCalculation.historicalNeed).toBe(1173);
    expect(result.totalNeed).toBe(1173);
    expect(result.parentResults[0].capacity).toBeGreaterThanOrEqual(0);
    expect(result.parentResults[1].capacity).toBeGreaterThanOrEqual(0);
    expect(result.totalCapacity).toBeGreaterThanOrEqual(0);
    expect(result.capacityDeficit).toBeGreaterThanOrEqual(0);
    expect(result.careDiscount.shortfallAdjustment).toBeGreaterThanOrEqual(0);
    expect(result.careDiscount.verifiableCareDiscount).toBeLessThanOrEqual(result.careDiscount.grossCareDiscount);
    expect(result.parentResults[0].paymentTotal).toBeGreaterThanOrEqual(0);
  });

  it("requires review before an illustrative new-partner case is used without maintenance data", () => {
    const result = calculate({
      historicalNBGI: 5752,
      parents: [
        {
          nbi: 3350,
          careDaysPerWeek: 1,
          newPartner: {
            present: true,
            name: "Dianne",
            relationship: "MARRIED",
            monthlyNbi: 890,
            selfSupporting: false,
            includedInCalculation: true,
            children: [{ label: "stiefkind", monthlyAmount: 300 }],
          },
        },
        { nbi: 1686, kgb: 716, careDaysPerWeek: 0 },
      ],
      children: [{ age: 7, residence: "B" }, { age: 4, residence: "B" }],
    });

    expect(result.parentResults[0].capacity).toBeGreaterThanOrEqual(0);
    expect(result.partnerReview[0].status).toBe("REVIEW_REQUIRED");
    expect(result.partnerReview[0].includedInCalculation).toBe(true);
    expect(result.warnings.some(w => w.includes("REVIEW_REQUIRED"))).toBe(true);
  });
});
