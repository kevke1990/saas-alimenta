import { describe, expect, it } from "vitest";
import { calculatePartnerAlimony } from "./partner-alimony-engine";

describe("Partner alimony engine foundation", () => {
  it("reduces professionally supplied need by recipient NBI", () => {
    const result = calculatePartnerAlimony({
      needBasisMonthly: 1800,
      recipientNbiMonthly: 500,
      payer: { nbi: 4000 },
    });

    expect(result.calculatedNeedMonthly).toBe(1300);
    expect(result.contributionMonthly).toBeLessThanOrEqual(1300);
    expect(result.audit.payerCapacityIncludesKgb).toBe(false);
  });

  it("does not use KGB in partner-support capacity", () => {
    const withoutKgb = calculatePartnerAlimony({
      needBasisMonthly: 1200,
      recipientNbiMonthly: 0,
      payer: { nbi: 4000 },
    });
    const withKgb = calculatePartnerAlimony({
      needBasisMonthly: 1200,
      recipientNbiMonthly: 0,
      payer: { nbi: 4000, kgb: 500 },
    });

    expect(withKgb.payerCapacityMonthly).toBe(withoutKgb.payerCapacityMonthly);
    expect(withKgb.warnings.some((warning) => warning.includes("KGB"))).toBe(true);
  });

  it("caps the contribution at the payer's available capacity", () => {
    const result = calculatePartnerAlimony({
      needBasisMonthly: 5000,
      recipientNbiMonthly: 0,
      payer: { nbi: 4000 },
    });

    expect(result.contributionMonthly).toBe(result.payerCapacityMonthly);
    expect(result.unmetNeedMonthly).toBe(5000 - result.payerCapacityMonthly);
  });

  it("keeps a professional override visible and bounded", () => {
    const result = calculatePartnerAlimony({
      needBasisMonthly: 2000,
      recipientNbiMonthly: 0,
      payer: { nbi: 4000 },
      contributionOverrideMonthly: 900,
    });

    expect(result.contributionMonthly).toBe(861);
    expect(result.audit.overrideApplied).toBe(true);
    expect(result.audit.requestedOverrideMonthly).toBe(900);
    expect(result.audit.calculatedContributionBeforeOverrideMonthly).toBe(861);
    expect(result.warnings.some((warning) => warning.includes("begrensd"))).toBe(true);
  });
});
