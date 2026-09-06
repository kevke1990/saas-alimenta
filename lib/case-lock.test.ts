import { describe, expect, it } from 'vitest';
import { calculationLockMessage, isCaseLockedForCalculation } from './case-lock';

describe('case calculation lock', () => {
  it('locks approved and final cases', () => {
    expect(isCaseLockedForCalculation('APPROVED')).toBe(true);
    expect(isCaseLockedForCalculation('FINAL')).toBe(true);
  });

  it('does not lock editable review states', () => {
    expect(isCaseLockedForCalculation('INCOMPLETE')).toBe(false);
    expect(isCaseLockedForCalculation('REVIEWED')).toBe(false);
    expect(isCaseLockedForCalculation(undefined)).toBe(false);
  });

  it('returns an actionable Dutch lock message', () => {
    expect(calculationLockMessage('APPROVED')).toContain('vergrendeld voor directe herberekening');
    expect(calculationLockMessage('APPROVED')).toContain('Open het dossier eerst opnieuw');
  });
});
