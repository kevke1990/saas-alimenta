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

  it("uses a multi-year business-profit average for the payer", () => {
    const result = calculatePartnerAlimony({
      needBasisMonthly: 2500,
      recipientNbiMonthly: 0,
      payer: { nbi: 4000 },
      payerBusinessProfitYears: [12000, 24000, 36000],
    });

    expect(result.incomeAnalysis.payerBusinessAverageMonthly).toBe(2000);
    expect(result.warnings.some((warning) => warning.includes("Ondernemersinkomen"))).toBe(true);
  });

  it("keeps dividend and asset income separately visible", () => {
    const result = calculatePartnerAlimony({
      needBasisMonthly: 1800,
      recipientNbiMonthly: 0,
      payer: { nbi: 3000 },
      payerDividendAnnual: 12000,
      payerBox3IncomeAnnual: 6000,
      payerAssetsIncomeMonthly: 250,
    });

    expect(result.incomeAnalysis.payerDividendMonthly).toBe(1000);
    expect(result.incomeAnalysis.assetsIncomePayer).toBe(750);
    expect(result.warnings.some((warning) => warning.includes("Vermogens-/dividendinkomen"))).toBe(true);
  });

  it("includes necessary pension provision and own-home signals in capacity review", () => {
    const result = calculatePartnerAlimony({
      needBasisMonthly: 1800,
      recipientNbiMonthly: 0,
      payer: { nbi: 4000 },
      payerPensionProvisionMonthly: 300,
      payerOwnHome: true,
      payerMortgagePrincipalMonthly: 1000,
      payerHousingCosts: 1400,
    });

    expect(result.steps.some((step) => step.title === "Draagkracht vóór PAL")).toBe(true);
    expect(result.warnings.some((warning) => warning.includes("Pensioen-/lijfrentepremie"))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes("Eigen woning"))).toBe(true);
  });

  it("supports recipient business income and verdiencapaciteit in the need calculation", () => {
    const result = calculatePartnerAlimony({
      needBasisMonthly: 2400,
      recipientNbiMonthly: 500,
      recipientBusinessProfitYears: [12000, 18000],
      recipientVerdiencapaciteit: 300,
      payer: { nbi: 5000 },
    });

    expect(result.incomeAnalysis.recipientBusinessAverageMonthly).toBe(1250);
    expect(result.need.ownIncome).toBe(1750);
    expect(result.need.earningCapacity).toBe(300);
    expect(result.need.additionalNeedNet).toBe(350);
    expect(result.warnings.some((warning) => warning.includes("Verdiencapaciteit"))).toBe(true);
  });

  it("applies income comparison only as an additional limiting check", () => {
    const result = calculatePartnerAlimony({
      needBasisMonthly: 3000,
      recipientNbiMonthly: 0,
      currentRecipientNBI: 1000,
      currentPayerNBI: 3000,
      incomeComparisonEnabled: true,
      payer: { nbi: 3000 },
    });

    expect(result.incomeComparison.enabled).toBe(true);
    expect(result.incomeComparison.applied).toBe(true);
    expect(result.incomeComparison.limitingAmountNet).not.toBeNull();
    expect(result.warnings.some((warning) => warning.includes("aanvullende redelijkheidstoets"))).toBe(true);
  });
});
