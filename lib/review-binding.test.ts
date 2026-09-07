import { describe, expect, it } from 'vitest';
import { buildReviewCalculationBinding, isReviewBindingCurrent } from './review-binding';

describe('review calculation binding', () => {
  const calculation = {
    id: 'calc-1',
    engineVersion: '1.3.1',
    normVersion: '2026.1',
    result: { calculationFingerprint: 'abc123' },
  };

  it('binds approval to the exact calculation snapshot', () => {
    const binding = buildReviewCalculationBinding(calculation);
    expect(binding).toEqual({ calculationId: 'calc-1', fingerprint: 'abc123', engineVersion: '1.3.1', normVersion: '2026.1' });
    expect(isReviewBindingCurrent(binding, binding)).toBe(true);
  });

  it('rejects a different calculation even when the fingerprint matches', () => {
    const binding = buildReviewCalculationBinding(calculation);
    expect(isReviewBindingCurrent(binding, { ...binding, calculationId: 'calc-2' })).toBe(false);
  });

  it('rejects a changed fingerprint, engine or norm version', () => {
    const binding = buildReviewCalculationBinding(calculation);
    expect(isReviewBindingCurrent({ ...binding, fingerprint: 'changed' }, binding)).toBe(false);
    expect(isReviewBindingCurrent({ ...binding, engineVersion: 'other' }, binding)).toBe(false);
    expect(isReviewBindingCurrent({ ...binding, normVersion: '2027.1' }, binding)).toBe(false);
  });

  it('supports legacy snapshots without a fingerprint but still binds the snapshot', () => {
    const legacy = buildReviewCalculationBinding({ ...calculation, result: {} });
    expect(legacy.fingerprint).toBeNull();
    expect(isReviewBindingCurrent(legacy, legacy)).toBe(true);
    expect(isReviewBindingCurrent({ ...legacy, calculationId: 'calc-2' }, legacy)).toBe(false);
  });
});
