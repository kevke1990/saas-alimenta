import { describe, expect, it } from 'vitest';
import { buildCalculationDifference } from './calculation-difference';

describe('calculation difference', () => {
  const previous = {
    fingerprint: 'old',
    inputSnapshot: {
      parents: [{ nbi: 4000 }, { nbi: 2500 }],
      children: [{ age: 8 }],
      effectiveDate: '2026-01-01',
    },
    result: {
      combined: {
        childSupportTotal: 450,
        partnerSupportMonthlyNet: 300,
        partnerSupportMonthlyGross: 400,
        totalMonthlyPayments: 750,
      },
    },
  };

  it('calculates transparent monthly deltas', () => {
    const current = {
      ...previous,
      fingerprint: 'new',
      inputSnapshot: {
        ...previous.inputSnapshot,
        parents: [{ nbi: 4500 }, { nbi: 2500 }],
      },
      result: {
        combined: {
          childSupportTotal: 500,
          partnerSupportMonthlyNet: 250,
          partnerSupportMonthlyGross: 333,
          totalMonthlyPayments: 750,
        },
      },
    };

    const difference = buildCalculationDifference({ previous, current });

    expect(difference.changed).toBe(true);
    expect(difference.delta.childSupport).toBe(50);
    expect(difference.delta.partnerSupportNet).toBe(-50);
    expect(difference.delta.partnerSupportGross).toBe(-67);
    expect(difference.delta.totalPayments).toBe(0);
  });

  it('identifies changed input paths', () => {
    const current = {
      ...previous,
      fingerprint: 'new',
      inputSnapshot: {
        ...previous.inputSnapshot,
        parents: [{ nbi: 4500 }, { nbi: 2500 }],
        children: [{ age: 9 }],
      },
    };

    const difference = buildCalculationDifference({ previous, current });

    expect(difference.inputChanges).toEqual([
      { path: 'children[0].age', previous: 8, current: 9 },
      { path: 'parents[0].nbi', previous: 4000, current: 4500 },
    ]);
  });

  it('is stable for identical snapshots', () => {
    const difference = buildCalculationDifference({ previous, current: previous });

    expect(difference.changed).toBe(false);
    expect(difference.inputChanges).toEqual([]);
    expect(difference.delta).toEqual({
      childSupport: 0,
      partnerSupportNet: 0,
      partnerSupportGross: 0,
      totalPayments: 0,
    });
  });

  it('supports results without partner support', () => {
    const current = {
      ...previous,
      fingerprint: 'new',
      result: { combined: { childSupportTotal: 500, totalMonthlyPayments: 500 } },
    };

    const difference = buildCalculationDifference({ previous, current });

    expect(difference.monthly.partnerSupportNet).toBe(0);
    expect(difference.monthly.partnerSupportGross).toBe(0);
    expect(difference.delta.totalPayments).toBe(-250);
  });
});
