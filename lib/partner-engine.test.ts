import { describe, expect, it } from 'vitest';
import { calculatePartnerSupport } from './partner-engine';

describe('Partneralimentatie engine 1.2.0', () => {
  it('calculates hofnorm from historical NBGI minus child costs', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 6063, historicalChildCosts: 880, currentRecipientNBI: 1103, currentPayerNBI: 5000 });
    expect(r.need.hofnormNet).toBe(3110);
    expect(r.need.additionalNeedNet).toBe(2007);
  });
  it('keeps KGB out of partner NBI by using the partner capacity engine', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 6000, historicalChildCosts: 1000, currentChildSupport: 861, currentRecipientNBI: 1000, currentPayerNBI: 4000 });
    expect(r.capacity.base).toBe(861);
  });
  it('subtracts child support before partner capacity', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 6000, historicalChildCosts: 1000, currentChildSupport: 861, currentRecipientNBI: 1000, currentPayerNBI: 4000 });
    expect(r.capacity.remainingNet).toBe(0);
    expect(r.result.monthlyNet).toBe(0);
  });
  it('grosses up a positive net partner amount', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 8000, historicalChildCosts: 0, currentRecipientNBI: 1000, currentPayerNBI: 6000, payerTaxableIncomeAnnual: 72000 });
    expect(r.result.monthlyGross).toBeGreaterThanOrEqual(r.result.monthlyNet);
  });
  it('can apply income comparison as a limiting check', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 10000, historicalChildCosts: 0, currentRecipientNBI: 2500, currentPayerNBI: 3000, incomeComparisonEnabled: true });
    expect(r.incomeComparison.applied).toBe(true);
    expect(r.result.limitedBy).toBe('INCOME_COMPARISON');
  });
  it('selects the requested historical NormSet for partner capacity and result provenance', () => {
    const current = calculatePartnerSupport({ historicalNBGI: 9000, historicalChildCosts: 0, currentRecipientNBI: 1000, currentPayerNBI: 4000, normYear: 2026 });
    const historical = calculatePartnerSupport({ historicalNBGI: 9000, historicalChildCosts: 0, currentRecipientNBI: 1000, currentPayerNBI: 4000, normYear: 2025 });
    expect(current.normVersion).toBe('2026.1');
    expect(historical.normVersion).toBe('2025.1');
    expect(historical.capacity.normYear).toBe(2025);
    expect(historical.capacity.base).not.toBe(current.capacity.base);
    expect(historical.warnings.some(w => w.includes('historische NormSet 2025'))).toBe(true);
  });
  it('uses the NormSet year as the default indexation rate when no explicit rate is supplied', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 9000, historicalChildCosts: 0, currentRecipientNBI: 1000, currentPayerNBI: 4000, normYear: 2025, historicalDate: '2025-01-01', effectiveDate: '2026-01-01' });
    expect(r.result.indexationPct).toBe(0.065);
  });
});

describe('Complexe PAL 1.2.0', () => {
  it('averages multi-year business profit instead of using one exceptional year', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 9000, historicalChildCosts: 0, currentRecipientNBI: 0, currentPayerNBI: 7000, payerBusinessProfitYears: [12000, 24000, 18000] });
    expect(r.incomeAnalysis.payerBusinessAverageMonthly).toBe(1500);
  });
  it('keeps recipient business income separate from verdiencapaciteit', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 9000, historicalChildCosts: 0, currentRecipientNBI: 1000, currentPayerNBI: 4000, recipientBusinessProfitYears: [12000, 18000], recipientVerdiencapaciteit: 500 });
    expect(r.incomeAnalysis.recipientBusinessAverageMonthly).toBe(1250);
    expect(r.need.earningCapacity).toBe(500);
    expect(r.need.ownIncome).toBe(2250);
  });
  it('includes declared mortgage tax benefit in payer NBI analysis', () => {
    const base = calculatePartnerSupport({ historicalNBGI: 9000, historicalChildCosts: 0, currentRecipientNBI: 0, currentPayerNBI: 4000 });
    const adjusted = calculatePartnerSupport({ historicalNBGI: 9000, historicalChildCosts: 0, currentRecipientNBI: 0, currentPayerNBI: 4000, payerMortgageInterestTaxBenefitMonthly: 300 });
    expect(adjusted.incomeAnalysis.payerAdjustedMonthly).toBe(base.incomeAnalysis.payerAdjustedMonthly + 300);
  });
  it('separates assets and dividends in the analysis', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 9000, historicalChildCosts: 0, currentRecipientNBI: 0, currentPayerNBI: 4000, payerDividendAnnual: 12000, payerBox3IncomeAnnual: 6000 });
    expect(r.incomeAnalysis.payerDividendMonthly).toBe(1000);
    expect(r.incomeAnalysis.assetsIncomePayer).toBe(500);
  });
});


describe("PAL historical regression fixtures 2024/2025/2026", () => {
  const base = {
    historicalNBGI: 5548,
    historicalChildCosts: 808,
    currentRecipientNBI: 1763,
    currentPayerNBI: 4156,
    currentChildSupport: 808,
  };

  it.each([\n    [2024, 280],\n    [2025, 237],\n    [2026, 185],\n  ] as const)("uses the published NormSet-specific Buijs gross-up for %s", (year, expectedGross) => {\n    const r = calculatePartnerSupport({ ...base, normYear: year });\n    expect(r.result.monthlyGross).toBe(expectedGross);\n    expect(r.capacity.method).toContain(`BUIJS_${year}`);\n  });\n\n  it.each([
    [2024, "2024.1", 984, 176],
    [2025, "2025.1", 960, 152],
    [2026, "2026.1", 927, 119],
  ] as const)("locks the historical PAL capacity fixture for %s", (year, version, capacity, remaining) => {
    const r = calculatePartnerSupport({ ...base, normYear: year });
    expect(r.normVersion).toBe(version);
    expect(r.capacity.base).toBe(capacity);
    expect(r.capacity.childSupportShare).toBe(808);
    expect(r.capacity.remainingNet).toBe(remaining);
    expect(r.result.monthlyNet).toBe(remaining);
  });
});
