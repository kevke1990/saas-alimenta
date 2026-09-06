import { describe, expect, it } from 'vitest';
import { calculatePartnerSupport } from './partner-engine';

describe('Partneralimentatie engine 1.1.1', () => {
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
});


describe('Complexe PAL 1.1.1', () => {
  it('averages multi-year business profit instead of using one exceptional year', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 9000, historicalChildCosts: 0, currentRecipientNBI: 0, currentPayerNBI: 7000, payerBusinessProfitYears: [12000, 24000, 18000] });
    expect(r.incomeAnalysis.payerBusinessAverageMonthly).toBe(1500);
  });
  it('keeps recipient business income separate from verdiencapaciteit', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 9000, historicalChildCosts: 0, currentRecipientNBI: 1000, recipientBusinessProfitYears: [12000, 18000], recipientVerdiencapaciteit: 500 });
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
