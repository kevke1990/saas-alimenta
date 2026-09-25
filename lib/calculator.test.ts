import { describe, expect, it } from "vitest";
import { calculate, capacity, careDiscount, childNeed } from "./calculator";
import { getNormYearForDate } from "./norms";
import { roundMoney, roundWholeEuro } from "./calculation-engine-v2";
import { calculateChildSupportCapacity, calculatePartnerSupportCapacity } from "./support-engine";

describe("Norm year resolution", () => {
  it("derives the NormSet from the calculation date when no normYear is supplied", () => {
    expect(getNormYearForDate("2024-06-01")).toBe(2024);
    expect(getNormYearForDate("2025-12-31")).toBe(2025);
    expect(getNormYearForDate("2026-09-21")).toBe(2026);
    const r = calculate({
      calculationDate: "2025-06-01",
      historicalNBGI: 5000,
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 10, residence: "A" }],
    });
    expect(r.normYear).toBe(2025);
    expect(r.normVersion).toBe("2025.1");
  });

  it("keeps an explicit normYear authoritative over the calculation date", () => {
    const r = calculate({
      calculationDate: "2025-06-01",
      normYear: 2026,
      historicalNBGI: 5000,
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 10, residence: "A" }],
    });
    expect(r.normYear).toBe(2026);
    expect(r.normVersion).toBe("2026.1");
  });

  it("rejects unsupported calculation years", () => {
    expect(() => getNormYearForDate("2027-01-01")).toThrow("Geen ondersteunde NormSet");
    expect(() => getNormYearForDate("2026/09/21")).toThrow("Ongeldige");
  });
});

describe("Alimenta Pro calculation engine 1.3.0", () => {
  it("supports historical NormSets through compatibility helpers", () => {
    expect(childNeed(5000, 1, 0, 2024)).toBe(720);
    expect(childNeed(5000, 1, 0, 2026)).toBe(680);
    expect(capacity({ nbi: 5000 }, 2024)).toBe(1561);
    expect(capacity({ nbi: 5000 }, 2026)).toBe(1495);
  });

  it("uses the official 2026 capacity formula above the threshold", () => {
    expect(capacity({ nbi: 5000 })).toBe(1495);
  });

  it("uses 5/15/25/35 care discount brackets", () => {
    expect(careDiscount(1000, 0)).toBe(50);
    expect(careDiscount(1000, 1)).toBe(150);
    expect(careDiscount(1000, 2)).toBe(250);
    expect(careDiscount(1000, 3)).toBe(350);
  });

  it("requires historical period metadata to confirm KGB treatment", () => {
    expect(() => calculate({ historicalPeriod: { nbgi: 5000, kgbIncluded: false }, parents: [{ nbi: 3000 }, { nbi: 2500 }], children: [{ age: 10, residence: "A" }] })).toThrow("KGB");
    const r = calculate({ historicalPeriod: { nbgi: 5000, kgbIncluded: true, calculationDate: "2024-06-01", effectiveDate: "2024-07-01", source: { type: "DOCUMENT", label: "Historische draagkrachtberekening" } }, normYear: 2024, parents: [{ nbi: 3000 }, { nbi: 2500 }], children: [{ age: 10, residence: "A" }] });
    expect(r.historicalPeriod?.nbgi).toBe(5000);
    expect(r.historicalPeriod?.source?.type).toBe("DOCUMENT");
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

    expect(r.engineVersion).toBe("1.4.0");
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

  it("uses the selected historical NormSet for minor need and parent capacity", () => {
    const r2024 = calculate({
      normYear: 2024,
      historicalNBGI: 5000,
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 10, residence: "A" }],
    });
    const r2026 = calculate({
      normYear: 2026,
      historicalNBGI: 5000,
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 10, residence: "A" }],
    });

    expect(r2024.normVersion).toBe("2024.1");
    expect(r2024.childResults[0].needSource).toBe("NEED_TABLE_2024");
    expect(r2024.totalNeed).not.toBe(r2026.totalNeed);
    expect(r2024.parentResults[0].capacityNormYear).toBe(2024);
    expect(r2024.parentResults[1].capacityNormYear).toBe(2024);
    expect(r2024.parentResults[0].capacity).not.toBe(r2026.parentResults[0].capacity);
  });

  it("keeps statutory indexation independent from the historical calculation NormSet", () => {
    const r = calculate({
      normYear: 2024,
      historicalNBGI: 5000,
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 10, residence: "A" }],
      indexation: 0.046,
    });

    expect(r.normVersion).toBe("2024.1");
    expect(r.indexation).toBe(0.046);
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

  it("uses the selected norm set and period for a young adult", () => {
    const r2024 = calculate({
      normYear: 2024,
      calculationDate: "2024-09-15",
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 18, residence: "A", studentType: "MBO", livesAtHome: true }],
    });
    const r2026 = calculate({
      normYear: 2026,
      calculationDate: "2026-09-16",
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 18, residence: "A", studentType: "MBO", livesAtHome: true }],
    });
    expect(r2024.childResults[0].isYoungAdult).toBe(true);
    expect(r2024.childResults[0].needSource).toBe("WSF_2024");
    expect(r2024.childResults[0].need).toBe(731);
    expect(r2026.childResults[0].needSource).toBe("WSF_2026");
    expect(r2026.childResults[0].need).toBe(783);
    expect(r2024.childResults[0].need).not.toBe(r2026.childResults[0].need);
  });

  it("requires a calculation date for young-adult WSF calculations", () => {
    expect(() => calculate({
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 18, residence: "A", studentType: "MBO", livesAtHome: true }],
    })).toThrow("reken-/ingangsdatum verplicht");
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


describe("Central monetary rounding policy", () => {
  it("keeps intermediate money at cents and final outputs at whole euros", () => {
    expect(roundMoney(123.456)).toBe(123.46);
    expect(roundWholeEuro(123.49)).toBe(123);
    expect(roundWholeEuro(123.5)).toBe(124);
  });
});


describe("Legal stepchild maintenance", () => {
  it("recognizes stepchildren for a married/registered parent and deducts an evidenced monthly contribution from capacity", () => {
    const r = calculate({
      historicalNBGI: 5000,
      parents: [
        {
          nbi: 3000,
          newPartner: {
            present: true,
            relationship: "REGISTERED_PARTNERSHIP",
            monthlyNbi: 2000,
            maintenanceObligation: true,
            includedInCalculation: true,
            children: [{ label: "Stiefkind", age: 8, livesAtHome: true, monthlyAmount: 120 }]
          }
        },
        { nbi: 2500 },
      ],
      children: [{ age: 10, residence: "B" }],
    });
    expect(r.parentResults[0].stiefchildMaintenance).toBe(120);
    expect(r.partnerReview[0].legalStepParent).toBe(true);
    expect(r.partnerReview[0].status).toBe("CALCULATED");
    expect(r.parentResults[0].capacity).toBe(431);
    expect(r.warnings.some((w: string) => w.includes("stiefkinderen"))).toBe(true);
  });

  it("does not invent a stiefchild contribution when the amount is missing", () => {
    const r = calculate({
      historicalNBGI: 5000,
      parents: [
        {
          nbi: 3000,
          newPartner: {
            present: true,
            relationship: "REGISTERED_PARTNERSHIP",
            monthlyNbi: 2000,
            children: [{ label: "Stiefkind", age: 8, livesAtHome: true }]
          }
        },
        { nbi: 2500 },
      ],
      children: [{ age: 10, residence: "B" }],
    });
    expect(r.parentResults[0].stiefchildMaintenance).toBe(0);
    expect(r.partnerReview[0].status).toBe("REVIEW_REQUIRED");
    expect(r.warnings.some((w: string) => w.includes("vastgestelde/onderbouwde maandbijdrage"))).toBe(true);
  });
});


describe("Final calculation hardening audit", () => {
  it("applies statutory indexation only when an existing contribution is explicitly supplied", () => {
    const base = calculate({
      historicalNBGI: 5000,
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 10, residence: "A" }],
      normYear: 2026,
    });
    expect(base.indexationCalculation).toMatchObject({
      applied: false,
      rate: 0.046,
      baseContribution: null,
      indexedContribution: null,
    });

    const indexed = calculate({
      historicalNBGI: 5000,
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 10, residence: "A" }],
      normYear: 2026,
      priorContribution: 1000,
      applyIndexation: true,
    });
    expect(indexed.indexationCalculation).toEqual({
      applied: true,
      rate: 0.046,
      baseContribution: 1000,
      indexedContribution: 1046,
    });
  });

  it("does not silently invent an indexation base", () => {
    expect(() => calculate({
      historicalNBGI: 5000,
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 10, residence: "A" }],
      normYear: 2026,
      applyIndexation: true,
    })).toThrow("bestaande bijdrage");
  });

  it("requires explicit young-adult education and residence inputs", () => {
    const base = {
      parents: [{ nbi: 3000 }, { nbi: 2500 }],
      children: [{ age: 18, residence: "A" as const }],
      calculationDate: "2026-09-25",
    };
    expect(() => calculate(base)).toThrow("MBO of HBO expliciet");
    expect(() => calculate({ ...base, children: [{ age: 18, residence: "A" as const, studentType: "OTHER" as const, livesAtHome: true }] })).toThrow("MBO of HBO expliciet");
    expect(() => calculate({ ...base, children: [{ age: 18, residence: "A" as const, studentType: "MBO" as const }] })).toThrow("expliciet worden vastgelegd of het kind thuis woont");
  });

  it("keeps mixed minor/young-adult scenarios on their own norm paths", () => {
    const result = calculate({
      historicalNBGI: 5000,
      parents: [{ nbi: 3000, careDaysPerWeek: 1 }, { nbi: 2500, careDaysPerWeek: 0 }],
      children: [
        { age: 10, residence: "A", specialCosts: 100 },
        { age: 18, residence: "A", studentType: "HBO", livesAtHome: true, ownIncome: 0, studyGrant: 0 },
      ],
      normYear: 2026,
      calculationDate: "2026-09-25",
    });
    expect(result.childResults[0].needSource).toBe("NEED_TABLE_2026");
    expect(result.childResults[1].needSource).toBe("WSF_2026");
    expect(result.childResults[0].specialCosts).toBe(100);
    expect(result.childResults[1].isYoungAdult).toBe(true);
    expect(result.childResults[0].need).toBeGreaterThan(result.childResults[0].baseNeed);
  });

  it("keeps per-child care shortfall adjustments transparent and bounded", () => {
    const result = calculate({
      historicalNBGI: 7500,
      parents: [
        { nbi: 1800, careDaysPerWeek: 0 },
        { nbi: 1800, careDaysPerWeek: 3 },
      ],
      children: [
        { age: 7, residence: "B" },
        { age: 4, residence: "B" },
      ],
      normYear: 2026,
    });

    expect(result.capacitySufficient).toBe(false);
    const grossByChild = result.childResults.map(c => Math.max(...c.grossCareDiscountByParent));
    const adjustmentByChild = result.transfers.map(t => t.shortfallCareDiscountAdjustment);
    expect(adjustmentByChild.every((value, i) => value >= 0 && value <= grossByChild[i])).toBe(true);
    expect(adjustmentByChild.reduce((sum, value) => sum + value, 0)).toBeLessThanOrEqual(result.careDiscount.grossCareDiscount);
  });
});
