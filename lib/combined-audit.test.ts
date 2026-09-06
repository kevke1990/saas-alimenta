import { describe, expect, it } from "vitest";
import { buildCombinedAudit } from "./combined-audit";

describe("buildCombinedAudit", () => {
  it("exposes child support as the prior obligation without double deduction", () => {
    const result = buildCombinedAudit({
      childSupportByParent: [1200, 0],
      partnerPayerIndex: 0,
      partnerMonthlyNet: 300,
      partnerMonthlyGross: 450,
      partnerCapacityRemainingNet: 400,
    });

    expect(result.partnerCapacityBeforeChildSupportMonthly).toBe(1600);
    expect(result.partnerCapacityAfterChildSupportMonthly).toBe(400);
    expect(result.childSupportForPartnerPayerMonthly).toBe(1200);
    expect(result.partnerSupportLimitedByChildPriority).toBe(false);
  });

  it("flags PAL when it exceeds remaining capacity after child support", () => {
    const result = buildCombinedAudit({
      childSupportByParent: [900, 0],
      partnerPayerIndex: 0,
      partnerMonthlyNet: 700,
      partnerMonthlyGross: 900,
      partnerCapacityRemainingNet: 500,
    });

    expect(result.partnerSupportLimitedByChildPriority).toBe(true);
    expect(result.warnings.some(w => w.includes("begrensd"))).toBe(true);
  });

  it("keeps child-only calculations free of PAL audit assumptions", () => {
    const result = buildCombinedAudit({
      childSupportByParent: [600, 0],
      partnerPayerIndex: null,
      partnerMonthlyNet: 0,
      partnerMonthlyGross: 0,
      partnerCapacityRemainingNet: 0,
    });

    expect(result.partnerSupportPresent).toBe(false);
    expect(result.childSupportPriorityApplied).toBe(false);
    expect(result.partnerCapacityBeforeChildSupportMonthly).toBe(0);
  });
});
