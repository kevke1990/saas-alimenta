import { describe, expect, it } from 'vitest';
import { compareScenarios, toScenarioComparison } from './scenario-comparison';

describe('scenario comparison', () => {
  it('normalizes combined child and partner support totals', () => {
    const result = toScenarioComparison({
      id: 's1',
      name: 'Hoger inkomen ouder A',
      fingerprint: 'abc',
      changes: { parents: { '0': { nbi: 5000 } } },
      result: {
        engineVersion: '1.3.1',
        combined: {
          childSupportTotal: 850,
          partnerSupportMonthlyGross: 600,
          partnerSupportMonthlyNet: 420,
          totalMonthlyPayments: 1450,
          paymentByParent: [1450, 0],
        },
      },
    });

    expect(result.childSupportMonthly).toBe(850);
    expect(result.partnerSupportMonthlyGross).toBe(600);
    expect(result.partnerSupportMonthlyNet).toBe(420);
    expect(result.totalMonthlyPayments).toBe(1450);
    expect(result.paymentByParent).toEqual([1450, 0]);
  });

  it('supports older scenario results without a combined object', () => {
    const result = toScenarioComparison({
      id: 'legacy',
      name: 'Oud scenario',
      result: {
        childSupportTotal: 500,
        partnerSupport: { monthlyGross: 300, monthlyNet: 210 },
      },
    });

    expect(result.childSupportMonthly).toBe(500);
    expect(result.partnerSupportMonthlyGross).toBe(300);
    expect(result.partnerSupportMonthlyNet).toBe(210);
    expect(result.totalMonthlyPayments).toBe(800);
  });

  it('maps a collection without losing scenario identity', () => {
    const rows = compareScenarios([
      { id: 'a', name: 'Basis', result: { combined: { childSupportTotal: 400, totalMonthlyPayments: 400 } } },
      { id: 'b', name: 'Wijziging', result: { combined: { childSupportTotal: 550, totalMonthlyPayments: 550 } } },
    ]);

    expect(rows.map((row) => row.scenarioId)).toEqual(['a', 'b']);
    expect(rows.map((row) => row.totalMonthlyPayments)).toEqual([400, 550]);
  });
});
