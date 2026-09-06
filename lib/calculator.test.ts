import { describe, expect, it } from "vitest";
import { calculate, capacity, careDiscount } from "./calculator";
import { calculateChildSupportCapacity, calculatePartnerSupportCapacity } from "./support-engine";

describe("Alimenta Pro calculation engine 1.0.0", () => {
  it("uses the official 2026 capacity formula above the threshold", () => {
    expect(capacity({ nbi: 5000 })).toBe(1495);
  });

  it("uses 5/15/25/35 care discount brackets", () => {
    expect(careDiscount(1000, 0)).toBe(50);
    expect(careDiscount(1000, 1)).toBe(150);
    expect(careDiscount(1000, 2)).toBe(250);
    expect(careDiscount(1000, 3)).toBe(350);
  });

  it("performs a full two-parent calculation with a resident parent", () => {
    const r = calculate({
      historicalNBGI: 5000,
      parents: [
        { nbi: 3000, careDaysPerWeek: 0 },
        { nbi: 2500, careDaysPerWeek: 1 },
      ],
      children: [{ age: 10, residence: "A" }],
    });

    expect(r.engineVersion).toBe("1.0.0");
    expect(r.normVersion).toBe("2026.1");
    expect(r.totalNeed).toBe(680);
    expect(r.transfers[0].payerIndex).toBe(1);
    expect(r.transfers[0].careDiscount).toBe(102);
    expect(r.transfers[0].payment).toBeGreaterThanOrEqual(0);
  });

  it("divides the 2026 table total across multiple minor children", () => {
    const r = calculate({
      historicalNBGI: 5000,
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 5, residence: "A" }, { age: 12, residence: "A" }],
    });
    expect(r.totalNeed).toBe(1145);
    expect(r.childResults[0].need + r.childResults[1].need).toBe(1145);
  });

  it("supports a 50/50 calculation as a net transfer", () => {
    const r = calculate({
      historicalNBGI: 5000,
      parents: [
        { nbi: 4000, careDaysPerWeek: 3 },
        { nbi: 2500, careDaysPerWeek: 3 },
      ],
      children: [{ age: 8, residence: "50-50" }],
    });
    expect(r.transfers[0].direction).toMatch(/A->B|B->A/);
    expect(r.transfers[0].payment).toBeGreaterThanOrEqual(0);
  });

  it("uses WSF as the basis for a young adult", () => {
    const r = calculate({
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 18, residence: "A", studentType: "MBO", livesAtHome: true }],
    });
    expect(r.childResults[0].isYoungAdult).toBe(true);
    expect(r.childResults[0].needSource).toBe("WSF_2026");
  });
});


describe("Shared support capacity foundation", () => {
  it("keeps KGB isolated to child-support capacity", () => {
    const child = calculateChildSupportCapacity({ nbi: 3000, kgb: 300 });
    const partner = calculatePartnerSupportCapacity({ nbi: 3000, kgb: 300 });
    expect(child.kgbIncluded).toBe(300);
    expect(partner.kgbIncluded).toBe(0);
    expect(partner.effectiveNBI).toBe(3000);
  });

  it("uses the 60% partner-support formula at NBI >= 2200", () => {
    const r = calculatePartnerSupportCapacity({ nbi: 4000 });
    expect(r.capacity).toBe(861);
    expect(r.method).toBe("FORMULA_60");
  });

  it("preserves the existing 70% child-support formula", () => {
    const r = calculateChildSupportCapacity({ nbi: 5000 });
    expect(r.capacity).toBe(1495);
    expect(r.method).toBe("FORMULA_70");
  });
});


describe("Production 1.0 regression safeguards", () => {
  it("uses the official minimum draagkracht below NBI 1950", () => {
    expect(calculateChildSupportCapacity({ nbi: 1800, childCount: 1 }).capacity).toBe(25);
    expect(calculateChildSupportCapacity({ nbi: 1800, childCount: 2 }).capacity).toBe(50);
  });

  it("does not automatically punish a parent for housing costs above the 30% woonbudget", () => {
    const base = calculateChildSupportCapacity({ nbi: 4000 });
    const highRent = calculateChildSupportCapacity({ nbi: 4000, housingCosts: 1800 });
    expect(highRent.capacity).toBe(base.capacity);
    expect(highRent.housingDifference).toBe(600);
  });

  it("does not apply care discount to additional special child costs", () => {
    const r = calculate({
      historicalNBGI: 5000,
      parents: [{ nbi: 3000, careDaysPerWeek: 0 }, { nbi: 2500, careDaysPerWeek: 1 }],
      children: [{ age: 10, residence: "A", specialCosts: 200 }],
    });
    expect(r.childResults[0].need).toBe(880);
    expect(r.childResults[0].careDiscountByParent[1]).toBe(102);
  });

  it("removes care discount when the capacity shortfall is at least twice the care discount", () => {
    const r = calculate({
      historicalNBGI: 5000,
      parents: [{ nbi: 1200, careDaysPerWeek: 0 }, { nbi: 1200, careDaysPerWeek: 3 }],
      children: [{ age: 10, residence: "A" }, { age: 12, residence: "A" }],
    });
    expect(r.capacitySufficient).toBe(false);
    expect(r.transfers[0].careDiscount).toBe(0);
  });
});
