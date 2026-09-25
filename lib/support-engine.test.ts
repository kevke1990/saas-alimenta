import { describe, expect, it } from 'vitest';
import { calculateChildSupportCapacity } from './support-engine';
import { getNormSet } from './norms';

describe('support-engine capacity corrections', () => {
  it('keeps the normative table route when a positive professional correction is supplied', () => {
    const result = calculateChildSupportCapacity(
      { nbi: 2000, capacityAdjustment: 100, childCount: 1 },
      getNormSet(2026),
    );

    expect(result.method).toBe('TABLE');
    expect(result.capacity).toBe(177);
    expect(result.capacityAdjustment).toBe(100);
  });

  it('keeps the normative table route when a negative professional correction is supplied', () => {
    const result = calculateChildSupportCapacity(
      { nbi: 2000, capacityAdjustment: -20, childCount: 1 },
      getNormSet(2026),
    );

    expect(result.method).toBe('TABLE');
    expect(result.capacity).toBe(57);
    expect(result.capacityAdjustment).toBe(-20);
  });

  it('keeps the housing budget based on NBI rather than NBI plus KGB', () => {
    const result = calculateChildSupportCapacity(
      { nbi: 2200, kgb: 400, childCount: 1 },
      getNormSet(2026),
    );

    expect(result.effectiveNBI).toBe(2600);
    expect(result.housingBudget).toBe(660);
    expect(result.capacity).toBe(403);
  });

  it('does not let a correction change the formula threshold decision', () => {
    const withoutCorrection = calculateChildSupportCapacity(
      { nbi: 2100, childCount: 1 },
      getNormSet(2026),
    );
    const withCorrection = calculateChildSupportCapacity(
      { nbi: 2100, capacityAdjustment: 50, childCount: 1 },
      getNormSet(2026),
    );

    expect(withoutCorrection.method).toBe('TABLE');
    expect(withCorrection.method).toBe('TABLE');
    expect(withCorrection.capacity).toBe(withoutCorrection.capacity + 50);
  });
});
