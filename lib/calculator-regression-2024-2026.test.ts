import { describe, expect, it } from "vitest";
import { calculate } from "./calculator";

describe("Merelo regression calculations", () => {
  it("keeps 2026 historical NBGI separate from current income and reproduces €686", () => {
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
    expect(result.parentResults[0].capacity).toBe(686);
    expect(result.parentResults[1].capacity).toBe(221);
    expect(result.totalCapacity).toBe(907);
    expect(result.capacityDeficit).toBe(411);
    expect(result.careDiscount.grossCareDiscount).toBe(197.7);
    expect(result.careDiscount.shortfallAdjustment).toBe(205.5);
    expect(result.careDiscount.verifiableCareDiscount).toBe(0);
    expect(result.careDiscount.appliedCareDiscount).toBe(0);
    expect(result.transfers.map(t => t.payment)).toEqual([343, 343]);
    expect(result.parentResults[0].paymentTotal).toBe(686);
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
    expect(result.warnings).toContain(expect.stringContaining("REVIEW_REQUIRED"));
    expect(result.warnings).toContain(expect.stringContaining("geen vastgesteld historisch NBGI"));
  });

  it("reproduces the 2024 mediator reference as a separate historical need with 2024 norms", () => {
    const result = calculate({
      historicalNBGI: 4683,
      historicalNeed: 1173,
      parents: [
        { nbi: 3682, careDaysPerWeek: 0 },
        { nbi: 2235, careDaysPerWeek: 1 },
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
    expect(result.parentResults[0].capacity).toBe(915);
    expect(result.parentResults[1].capacity).toBe(206);
    expect(result.totalCapacity).toBe(1121);
    expect(result.capacityDeficit).toBe(52);
    expect(result.careDiscount.grossCareDiscount).toBeCloseTo(175.95, 2);
    expect(result.careDiscount.shortfallAdjustment).toBe(26);
    expect(result.careDiscount.verifiableCareDiscount).toBeCloseTo(149.95, 2);
    expect(result.parentResults[0].paymentTotal).toBe(766);
  });

  it("requires review before a new partner can be included in the calculation without maintenance data", () => {
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

    expect(result.parentResults[0].capacity).toBe(686);
    expect(result.partnerReview[0].status).toBe("REVIEW_REQUIRED");
    expect(result.partnerReview[0].includedInCalculation).toBe(true);
    expect(result.warnings).toContain(expect.stringContaining("REVIEW_REQUIRED"));
  });
});
