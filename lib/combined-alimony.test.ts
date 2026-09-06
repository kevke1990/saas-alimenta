import { describe, expect, it } from "vitest";
import { combineAlimonyResults } from "./combined-alimony";

const partner = {
  engineVersion: "0.1.0",
  needBasisMonthly: 1800,
  recipientNbiMonthly: 500,
  calculatedNeedMonthly: 1300,
  payerCapacityMonthly: 1600,
  contributionMonthly: 1300,
  unmetNeedMonthly: 0,
  capacityRemainingMonthly: 300,
  capacityMethod: "FORMULA_60",
  warnings: ["professionele controle"],
  audit: {
    recipientOwnIncomeUsed: true,
    payerCapacityIncludesKgb: false,
    overrideApplied: false,
  },
} as const;

describe("combineAlimonyResults", () => {
  it("puts child support before partner support", () => {
    const result = combineAlimonyResults({
      childSupport: [{ payerIndex: 0, paymentMonthly: 1200 }],
      partnerSupport: partner,
      partnerPayerIndex: 0,
    });

    expect(result.childSupportMonthly).toBe(1200);
    expect(result.partnerCapacityBeforeChildSupportMonthly).toBe(1600);
    expect(result.partnerCapacityAfterChildSupportMonthly).toBe(400);
    expect(result.partnerSupportMonthly).toBe(400);
    expect(result.totalMonthly).toBe(1600);
    expect(result.partnerSupportLimitedByChildPriority).toBe(true);
    expect(result.audit.childSupportPriorityApplied).toBe(true);
  });

  it("keeps the full partner contribution when capacity remains sufficient", () => {
    const result = combineAlimonyResults({
      childSupport: [{ payerIndex: 0, paymentMonthly: 200 }],
      partnerSupport: partner,
      partnerPayerIndex: 0,
    });

    expect(result.partnerSupportMonthly).toBe(1300);
    expect(result.totalMonthly).toBe(1500);
    expect(result.partnerSupportLimitedByChildPriority).toBe(false);
  });

  it("supports a child-only result", () => {
    const result = combineAlimonyResults({
      childSupport: [
        { payerIndex: 0, paymentMonthly: 450 },
        { payerIndex: 0, paymentMonthly: 150 },
      ],
    });

    expect(result.childSupportMonthly).toBe(600);
    expect(result.partnerSupportMonthly).toBe(0);
    expect(result.totalMonthly).toBe(600);
    expect(result.audit.partnerSupportPresent).toBe(false);
  });
});
