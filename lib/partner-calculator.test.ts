import { describe, expect, it } from "vitest";
import { calculatePartnerSupport } from "./partner-calculator";
import { getCumulativeIndexationFactor } from "./indexation";

describe("partner-support engine 2.2.0", () => {
  it("applies the 60% Hofnorm after the child-cost share", () => {
    const r = calculatePartnerSupport({ marriageNBGI: 5548, childShareDuringMarriage: 808, payer: { nbi: 4156 }, recipientCurrentNBI: 1763 });
    expect(r.normVersion).toBe("2026.1");
    expect(r.hofNormBase).toBe(4740);
    expect(r.grossNeedBeforeOwnIncome).toBe(2844);
    expect(r.additionalNeed).toBe(1081);
    expect(r.netPartnerSupport).toBe(927);
  });

  it("adds substantiated earning capacity to current NBI when determining remaining need", () => {
    const r = calculatePartnerSupport({
      marriageNBGI: 5548,
      childShareDuringMarriage: 808,
      payer: { nbi: 4156 },
      recipientCurrentNBI: 1763,
      recipientEarningCapacity: 500,
    });

    // 2844 hofnorm behoefte - 1763 current NBI - 500 earning capacity = 581.
    expect(r.recipientResources).toBe(2263);
    expect(r.additionalNeed).toBe(581);
    expect(r.netPartnerSupport).toBe(581);
  });

  it("uses the 60% partner formula below the child-support table threshold", () => {
    const r = calculatePartnerSupport({
      marriageNBGI: 5000,
      payer: { nbi: 2000 },
      recipientCurrentNBI: 0,
    });

    // 60% × [2000 - (30% × 2000 + 1365)] = 21.
    expect(r.payerCapacityBeforeChildren).toBe(21);
    expect(r.capacityMethod).toBe("FORMULA_60");
  });

  it("uses the requested historical NormSet for payer capacity", () => {
    const r2025 = calculatePartnerSupport({ marriageNBGI: 5548, childShareDuringMarriage: 808, payer: { nbi: 4156 }, recipientCurrentNBI: 1763, normYear: 2025 });
    const r2026 = calculatePartnerSupport({ marriageNBGI: 5548, childShareDuringMarriage: 808, payer: { nbi: 4156 }, recipientCurrentNBI: 1763, normYear: 2026 });
    expect(r2025.normYear).toBe(2025);
    expect(r2025.normVersion).toBe("2025.1");
    expect(r2025.warnings.some(w => w.includes("2025.1"))).toBe(true);
    expect(r2025.payerCapacityBeforeChildren).not.toBe(r2026.payerCapacityBeforeChildren);
  });


  it("regresses payer capacity and remaining PAL capacity across 2024-2026 NormSets", () => {
    const base = { marriageNBGI: 5548, childShareDuringMarriage: 808, payer: { nbi: 4156 }, recipientCurrentNBI: 1763 };
    const r2024 = calculatePartnerSupport({ ...base, normYear: 2024 });
    const r2025 = calculatePartnerSupport({ ...base, normYear: 2025 });
    const r2026 = calculatePartnerSupport({ ...base, normYear: 2026 });
    expect(r2024.normVersion).toBe("2024.1");
    expect(r2025.normVersion).toBe("2025.1");
    expect(r2026.normVersion).toBe("2026.1");
    expect(r2024.payerCapacityBeforeChildren).toBe(984);
    expect(r2025.payerCapacityBeforeChildren).toBe(960);
    expect(r2026.payerCapacityBeforeChildren).toBe(927);
    expect(r2024.netPartnerSupport).toBe(984);
    expect(r2025.netPartnerSupport).toBe(960);
    expect(r2026.netPartnerSupport).toBe(927);
  });

  it("keeps historical norm selection separate from statutory indexation year", () => {
    const r = calculatePartnerSupport({ marriageNBGI: 5548, childShareDuringMarriage: 808, payer: { nbi: 4156 }, recipientCurrentNBI: 1763, normYear: 2025, indexationYear: 2026 });
    expect(r.normVersion).toBe("2025.1");
    expect(r.indexedNetPartnerSupport).toBeGreaterThan(r.netPartnerSupport);
  });

  it("applies legal indexation when an explicit indexation year is supplied", () => {
    const r = calculatePartnerSupport({ marriageNBGI: 5548, childShareDuringMarriage: 808, payer: { nbi: 4156 }, recipientCurrentNBI: 1763, indexationYear: 2026 });
    expect(r.netPartnerSupport).toBe(927);
    expect(r.indexedNetPartnerSupport).toBe(970);
    expect(r.warnings.some(w => w.includes("2026"))).toBe(true);
  });

  it("allows older legal indexation years for historical calculations", () => {
    const r = calculatePartnerSupport({ marriageNBGI: 5548, childShareDuringMarriage: 808, payer: { nbi: 4156 }, recipientCurrentNBI: 1763, indexationYear: 2025 });
    expect(r.indexedNetPartnerSupport).toBe(987);
  });

  it("compounds statutory indexation from a source year through the target year", () => {
    const factor = getCumulativeIndexationFactor(2024, 2026);
    expect(factor).toBeCloseTo(1.065 * 1.046, 12);
    const r = calculatePartnerSupport({ marriageNBGI: 5548, childShareDuringMarriage: 808, payer: { nbi: 4156 }, recipientCurrentNBI: 1763, indexationFromYear: 2024, indexationYear: 2026 });
    expect(r.indexedNetPartnerSupport).toBe(1033);
    expect(r.warnings.some(w => w.includes("2024") && w.includes("2026"))).toBe(true);
  });

  it("rejects a source year without a target year", () => {
    expect(() => calculatePartnerSupport({ marriageNBGI: 5000, payer: { nbi: 4000 }, recipientCurrentNBI: 1000, indexationFromYear: 2024 })).toThrow("bronjaar");
  });

  it("gives child support priority before partner support", () => {
    const r = calculatePartnerSupport({ marriageNBGI: 6000, childShareDuringMarriage: 1000, payer: { nbi: 4000 }, recipientCurrentNBI: 1000, payerChildSupportShare: 700 });
    expect(r.payerRemainingCapacity).toBeLessThan(r.payerCapacityBeforeChildren);
    expect(r.netPartnerSupport).toBe(r.payerRemainingCapacity);
  });

  it("supports the optional 45% family route explicitly", () => {
    const r = calculatePartnerSupport({ marriageNBGI: 5000, payer: { nbi: 4000, childCount: 1, isCareParent: true }, recipientCurrentNBI: 0, payerCapacityPercentage: 0.45 });
    expect(r.capacityMethod).toBe("FORMULA_45");
    expect(r.warnings.some(w => w.includes("45%-gezinsroute"))).toBe(true);
  });

  it("does not count KGB as partner-support income", () => {
    const withKgb = calculatePartnerSupport({ marriageNBGI: 5000, payer: { nbi: 4000, kgb: 500 }, recipientCurrentNBI: 1000 });
    const withoutKgb = calculatePartnerSupport({ marriageNBGI: 5000, payer: { nbi: 4000 }, recipientCurrentNBI: 1000 });
    expect(withKgb.payerCapacityBeforeChildren).toBe(withoutKgb.payerCapacityBeforeChildren);
  });
});
