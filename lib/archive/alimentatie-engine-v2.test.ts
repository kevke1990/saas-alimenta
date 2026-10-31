import { describe, expect, it } from "vitest";
import { assessKgb, calculateChildSupport, careDiscountPercent } from "./alimentatie-engine-v2";

describe("alimentatie engine v2", () => {
  it("uses the care-discount bands", () => {
    expect(careDiscountPercent(0)).toBe(5);
    expect(careDiscountPercent(1)).toBe(15);
    expect(careDiscountPercent(2)).toBe(25);
    expect(careDiscountPercent(3)).toBe(35);
  });

  it("does not silently treat incomplete KGB data as eligible", () => {
    const result = assessKgb({ status: "received", monthlyAmount: 250, referenceYear: 2026 });
    expect(result.status).toBe("unknown");
    expect(result.amountIncludedMonthly).toBe(250);
    expect(result.missingChecks.length).toBeGreaterThan(0);
  });

  it("rejects KGB when a required condition is explicitly false", () => {
    const result = assessKgb({
      status: "received",
      monthlyAmount: 250,
      referenceYear: 2026,
      childUnder18: false,
      responsibleForChild: true,
      qualifyingResidence: true,
      incomeWithinLimit: true,
      assetsWithinLimit: true,
      partnerSituationKnown: true,
    });
    expect(result.status).toBe("not_eligible");
    expect(result.amountIncludedMonthly).toBe(0);
  });

  it("returns a transparent result with formulas and sources", () => {
    const result = calculateChildSupport({
      referenceYear: 2026,
      children: [{ id: "child-1", age: 8 }],
      parentA: { id: "A", netDisposableIncomeMonthly: 3000, kgb: { status: "not_received", referenceYear: 2026 } },
      parentB: { id: "B", netDisposableIncomeMonthly: 2000, kgb: { status: "not_received", referenceYear: 2026 } },
      totalChildNeedMonthly: 800,
      careParentId: "A",
      care: { averageCareDaysPerWeek: 1 },
    });
    expect(result.summary.totalNeedMonthly).toBe(800);
    expect(result.details).toHaveProperty("formulas");
    expect(result.sources.some((source) => source.id === "ECLI_NL_HR_2015_3011")).toBe(true);
  });
});
