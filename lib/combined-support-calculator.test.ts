import { describe, expect, it } from "vitest";
import { calculateCombinedSupport } from "./combined-support-calculator";

const baseChild = {
  parents: [
    { nbi: 5000, careDaysPerWeek: 3 },
    { nbi: 4000, careDaysPerWeek: 1 },
  ],
  children: [{ age: 10, residence: "A" as const }],
  historicalNBGI: 5000,
};

describe("combined child + partner support engine", () => {
  it("feeds the payer's calculated child-cost share into partner support", () => {
    const r = calculateCombinedSupport({
      child: baseChild,
      partner: {
        payerIndex: 1,
        marriageNBGI: 6000,
      },
    });

    expect(r.integration.childCostShareSource).toBe("CHILD_CALCULATION");
    expect(r.integration.childCostShare).toBe(r.childSupport.parentResults[1].allocatedNeed);
    expect(r.partnerSupport.payerChildSupportShare).toBe(r.integration.childCostShare);
    expect(r.partnerSupport.payerRemainingCapacity).toBeLessThan(r.partnerSupport.payerCapacityBeforeChildren);
  });

  it("uses the calculated allocated child-cost share, not the final transfer payment", () => {
    const r = calculateCombinedSupport({
      child: {
        parents: [
          { nbi: 2000, careDaysPerWeek: 3 },
          { nbi: 1950, careDaysPerWeek: 0 },
        ],
        children: [{ age: 10, residence: "A" as const }],
        historicalNBGI: 5000,
      },
      partner: {
        payerIndex: 1,
        marriageNBGI: 6000,
      },
    });

    expect(r.childSupport.capacitySufficient).toBe(false);
    expect(r.integration.childCostShare).toBe(r.childSupport.parentResults[1].allocatedNeed);
    expect(r.integration.childSupportPaymentTotal).toBeLessThanOrEqual(r.integration.childCostShare);
    expect(r.partnerSupport.payerRemainingCapacity).toBe(0);
    expect(r.partnerSupport.netPartnerSupport).toBe(0);
  });

  it("aggregates the payer's share across multiple children", () => {
    const r = calculateCombinedSupport({
      child: {
        parents: [
          { nbi: 5000, careDaysPerWeek: 3 },
          { nbi: 4000, careDaysPerWeek: 1 },
        ],
        children: [
          { age: 8, residence: "A" as const },
          { age: 11, residence: "A" as const },
        ],
        historicalNBGI: 5000,
      },
      partner: { payerIndex: 1, marriageNBGI: 6000 },
    });

    expect(r.childSupport.totalNeed).toBe(1145);
    expect(r.integration.childCostShare).toBe(r.childSupport.parentResults[1].allocatedNeed);
    expect(r.partnerSupport.payerChildSupportShare).toBe(r.integration.childCostShare);
  });

  it("preserves the child calculation's care-discount result while using the child cost share for partner priority", () => {
    const r = calculateCombinedSupport({
      child: baseChild,
      partner: { payerIndex: 1, marriageNBGI: 6000 },
    });

    expect(r.childSupport.parentResults[1].totalCareDiscount).toBeGreaterThan(0);
    expect(r.integration.childCostShare).toBe(r.childSupport.parentResults[1].allocatedNeed);
    expect(r.integration.childSupportPaymentTotal).toBe(r.childSupport.parentResults[1].paymentTotal);
  });

  it("returns zero partner support when the child-cost share consumes payer capacity", () => {
    const r = calculateCombinedSupport({
      child: {
        parents: [
          { nbi: 5000, careDaysPerWeek: 3 },
          { nbi: 2000, careDaysPerWeek: 0 },
        ],
        children: [{ age: 10, residence: "A" as const }],
        historicalNBGI: 5000,
      },
      partner: { payerIndex: 1, marriageNBGI: 6000 },
    });

    expect(r.partnerSupport.payerRemainingCapacity).toBe(0);
    expect(r.partnerSupport.netPartnerSupport).toBe(0);
  });

  it("still allows an explicit professional child-support-share override", () => {
    const r = calculateCombinedSupport({
      child: baseChild,
      partner: {
        payerIndex: 1,
        marriageNBGI: 6000,
        payerChildSupportShare: 100,
      },
    });

    expect(r.integration.childCostShareSource).toBe("MANUAL_OVERRIDE");
    expect(r.integration.childCostShare).toBe(100);
    expect(r.partnerSupport.payerChildSupportShare).toBe(100);
  });

  it("passes the selected historical NormSet through both engines", () => {
    const r = calculateCombinedSupport({
      child: { ...baseChild, normYear: 2025 },
      partner: { payerIndex: 1, marriageNBGI: 6000, normYear: 2025 },
    });

    expect(r.childSupport.normYear).toBe(2025);
    expect(r.childSupport.normVersion).toBe("2025.1");
    expect(r.partnerSupport.normYear).toBe(2025);
    expect(r.partnerSupport.normVersion).toBe("2025.1");
    expect(r.integration.childCostShareSource).toBe("CHILD_CALCULATION");
  });
});
