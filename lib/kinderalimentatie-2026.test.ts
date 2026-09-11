import { describe, expect, it } from "vitest";
import { calculate, childNeed, careDiscount, careDiscountPercentage } from "./calculator";
import { calculateChildSupportCapacity } from "./support-engine";

describe("Kinderalimentatie 2026 — juridische rekenregels", () => {
  it("uses the official 2026 need table as total need, not per-child need", () => {
    expect(childNeed(3000, 1)).toBe(350);
    expect(childNeed(3000, 2)).toBe(605);
    expect(childNeed(3000, 3)).toBe(645);
  });

  it("uses the official 2026 non-AOW capacity boundaries", () => {
    expect(calculateChildSupportCapacity({ nbi: 1949, childCount: 1 }).capacity).toBe(25);
    expect(calculateChildSupportCapacity({ nbi: 1950, childCount: 1 }).capacity).toBe(50);
    expect(calculateChildSupportCapacity({ nbi: 2000, childCount: 1 }).capacity).toBe(77);
    expect(calculateChildSupportCapacity({ nbi: 2050, childCount: 1 }).capacity).toBe(96);
    expect(calculateChildSupportCapacity({ nbi: 2100, childCount: 1 }).capacity).toBe(109);
    expect(calculateChildSupportCapacity({ nbi: 2150, childCount: 1 }).capacity).toBe(116);
    expect(calculateChildSupportCapacity({ nbi: 2200, childCount: 1 }).capacity).toBe(123);
  });

  it("uses the official 70% formula at and above €2,200", () => {
    const result = calculateChildSupportCapacity({ nbi: 3000, childCount: 1 });
    expect(result.capacity).toBe(515);
    expect(result.method).toBe("FORMULA_70");
    expect(result.housingBudget).toBe(900);
    expect(result.necessaryLivingCosts).toBe(1365);
  });

  it("uses the official AOW boundaries and formula threshold", () => {
    expect(calculateChildSupportCapacity({ nbi: 2179, aow: true, childCount: 1 }).capacity).toBe(25);
    expect(calculateChildSupportCapacity({ nbi: 2180, aow: true, childCount: 1 }).capacity).toBe(51);
    expect(calculateChildSupportCapacity({ nbi: 2380, aow: true, childCount: 1 }).capacity).toBe(116);
    expect(calculateChildSupportCapacity({ nbi: 2430, aow: true, childCount: 1 }).capacity).toBe(123);
    expect(calculateChildSupportCapacity({ nbi: 2430, aow: true, childCount: 1 }).method).toBe("FORMULA_70");
  });

  it("applies the official 5/15/25/35% care-discount bands", () => {
    expect(careDiscountPercentage(0)).toBe(0.05);
    expect(careDiscountPercentage(1)).toBe(0.15);
    expect(careDiscountPercentage(2)).toBe(0.25);
    expect(careDiscountPercentage(3)).toBe(0.35);
    expect(careDiscount(350, 1)).toBe(53);
  });

  it("matches the 2026 Expertgroep worked example for capacity comparison and care discount", () => {
    const result = calculate({
      historicalNBGI: 3000,
      parents: [
        { nbi: 2400, careDaysPerWeek: 0 },
        { nbi: 2313, careDaysPerWeek: 1 },
      ],
      children: [{ age: 8, residence: "A" }],
    });

    expect(result.totalNeed).toBe(350);
    expect(result.totalCapacity).toBe(400);
    expect(result.parentResults[0].capacity).toBe(221);
    expect(result.parentResults[1].capacity).toBe(179);
    expect(result.childResults[0].parentShares).toEqual([193, 157]);
    expect(result.childResults[0].payments.payment).toBe(104);
    expect(result.childResults[0].payments.careDiscount).toBe(53);
  });

  it("reduces a care discount when joint capacity is insufficient", () => {
    const result = calculate({
      historicalNBGI: 3000,
      parents: [
        { nbi: 2200, careDaysPerWeek: 0 },
        { nbi: 1950, careDaysPerWeek: 1 },
      ],
      children: [{ age: 8, residence: "A" }],
    });

    expect(result.totalNeed).toBe(350);
    expect(result.totalCapacity).toBe(173);
    expect(result.capacitySufficient).toBe(false);
    expect(result.capacityDeficit).toBe(177);
    expect(result.childResults[0].payments.payment).toBeGreaterThan(0);
    expect(result.childResults[0].payments.careDiscount).toBeLessThan(53);
  });
});
