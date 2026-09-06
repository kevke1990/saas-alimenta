import { describe, expect, it } from 'vitest';
import { validateOverride, overrideFingerprint } from './professional-override';
import { rateLimit } from './rate-limit';
import { retentionCutoff, validateRetentionPolicy } from './retention';

describe('v1.3 hardening', () => {
  it('requires professional justification for overrides', () => {
    expect(() => validateOverride({field:'partner.result.monthlyNet',overrideValue:700,reason:'kort'})).toThrow();
    const v = validateOverride({field:'partner.result.monthlyNet',originalValue:650,overrideValue:700,reason:'Onderbouwde afwijking met dossierstukken.'});
    expect(v.overrideValue).toBe(700);
  });
  it('fingerprint is deterministic', () => {
    const a=[{field:'x',originalValue:1,overrideValue:2,reason:'voldoende onderbouwing'}];
    expect(overrideFingerprint(a)).toBe(overrideFingerprint(a));
  });
  it('validates retention policies and produces a cutoff', () => {
    expect(validateRetentionPolicy({documentsDays:365}).documentsDays).toBe(365);
    expect(() => validateRetentionPolicy({documentsDays:10})).toThrow();
    expect(retentionCutoff(new Date('2026-01-01T00:00:00Z'),30).toISOString()).toBe('2025-12-02T00:00:00.000Z');
  });
  it('rate limits repeated requests', () => {
    const key='test-v13-'+Date.now();
    expect(rateLimit(key,2,60000).ok).toBe(true);
    expect(rateLimit(key,2,60000).ok).toBe(true);
    expect(rateLimit(key,2,60000).ok).toBe(false);
  });
});
