import { describe, expect, it } from 'vitest';
import { calculationFingerprint } from './calculation-snapshot';

describe('calculation fingerprint', () => {
  it('is stable when object key order changes', () => {
    const a = { parents: [{ nbi: 3200, name: 'A' }], children: [{ age: 8, name: 'K' }] };
    const b = { children: [{ name: 'K', age: 8 }], parents: [{ name: 'A', nbi: 3200 }] };
    expect(calculationFingerprint(a, '1.0.0', '2026.1')).toBe(calculationFingerprint(b, '1.0.0', '2026.1'));
  });

  it('changes when calculation input changes', () => {
    const base = { parents: [{ nbi: 3200 }], children: [{ age: 8 }] };
    const changed = { parents: [{ nbi: 3300 }], children: [{ age: 8 }] };
    expect(calculationFingerprint(base, '1.0.0', '2026.1')).not.toBe(calculationFingerprint(changed, '1.0.0', '2026.1'));
  });

  it('changes when engine or norm version changes', () => {
    const input = { parents: [{ nbi: 3200 }], children: [{ age: 8 }] };
    const fingerprint = calculationFingerprint(input, '1.0.0', '2026.1');
    expect(calculationFingerprint(input, '1.0.1', '2026.1')).not.toBe(fingerprint);
    expect(calculationFingerprint(input, '1.0.0', '2026.2')).not.toBe(fingerprint);
  });

  it('keeps an unchanged snapshot reproducible while a revised input gets a new fingerprint', () => {
    const originalInput = {
      effectiveDate: '2026-01-01',
      parents: [{ nbi: 3200, housingCosts: 900 }],
      children: [{ age: 8, name: 'K' }],
    };
    const revisedInput = {
      ...originalInput,
      parents: [{ ...originalInput.parents[0], nbi: 3350 }],
    };
    const originalFingerprint = calculationFingerprint(originalInput, '1.3.1', '2026.1');

    expect(calculationFingerprint(originalInput, '1.3.1', '2026.1')).toBe(originalFingerprint);
    expect(calculationFingerprint(revisedInput, '1.3.1', '2026.1')).not.toBe(originalFingerprint);
  });
});
