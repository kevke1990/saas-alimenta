import { describe, expect, it } from 'vitest';
import { buildCalculationDifference } from '@/lib/calculation-difference';

describe('buildCalculationDifference', () => {
  it('detects changed inputs and calculates monthly deltas', () => {
    const result = buildCalculationDifference({
      previous: {
        inputSnapshot: { parents: [{ income: { netIncomeMonthly: 3000 } }], children: [{ age: 7 }] },
        result: { combined: { childSupportTotal: 400, partnerSupportMonthlyNet: 100, partnerSupportMonthlyGross: 140, totalMonthlyPayments: 500 } },
        fingerprint: 'old',
      },
      current: {
        inputSnapshot: { parents: [{ income: { netIncomeMonthly: 3300 } }], children: [{ age: 7 }] },
        result: { combined: { childSupportTotal: 450, partnerSupportMonthlyNet: 120, partnerSupportMonthlyGross: 165, totalMonthlyPayments: 570 } },
        fingerprint: 'new',
      },
    });

    expect(result.changed).toBe(true);
    expect(result.delta).toEqual({ childSupport: 50, partnerSupportNet: 20, partnerSupportGross: 25, totalPayments: 70 });
    expect(result.inputChanges).toEqual([{ path: 'parents[0].income.netIncomeMonthly', previous: 3000, current: 3300 }]);
  });

  it('reports an unchanged snapshot when fingerprint and inputs match', () => {
    const snapshot = { parents: [{ name: 'A' }], children: [{ age: 7 }] };
    const result = buildCalculationDifference({
      previous: { inputSnapshot: snapshot, result: { totalPayment: 500 }, fingerprint: 'same' },
      current: { inputSnapshot: snapshot, result: { totalPayment: 500 }, fingerprint: 'same' },
    });

    expect(result.changed).toBe(false);
    expect(result.inputChanges).toEqual([]);
    expect(result.delta.totalPayments).toBe(0);
  });

  it('handles removed array entries without throwing', () => {
    const result = buildCalculationDifference({
      previous: { inputSnapshot: { children: [{ name: 'A' }, { name: 'B' }] }, result: {}, fingerprint: 'a' },
      current: { inputSnapshot: { children: [{ name: 'A' }] }, result: {}, fingerprint: 'b' },
    });

    expect(result.changed).toBe(true);
    expect(result.inputChanges).toEqual([{ path: 'children[1]', previous: { name: 'B' }, current: undefined }]);
  });
});
