import { describe, expect, it } from 'vitest';
import { isAllowedReviewTransition, isExplicitReopen, isReviewStatus } from './review-workflow';

describe('review workflow', () => {
  it('accepts the supported professional workflow', () => {
    expect(isAllowedReviewTransition('INCOMPLETE', 'READY_FOR_REVIEW')).toBe(true);
    expect(isAllowedReviewTransition('READY_FOR_REVIEW', 'REVIEWED')).toBe(true);
    expect(isAllowedReviewTransition('REVIEWED', 'APPROVED')).toBe(true);
    expect(isAllowedReviewTransition('APPROVED', 'FINAL')).toBe(true);
  });

  it('accepts a complete reopen-and-review cycle after FINAL', () => {
    const firstCycle = [
      ['INCOMPLETE', 'READY_FOR_REVIEW'],
      ['READY_FOR_REVIEW', 'REVIEWED'],
      ['REVIEWED', 'APPROVED'],
      ['APPROVED', 'FINAL'],
    ] as const;
    const secondCycle = [
      ['FINAL', 'INCOMPLETE'],
      ['INCOMPLETE', 'READY_FOR_REVIEW'],
      ['READY_FOR_REVIEW', 'REVIEWED'],
      ['REVIEWED', 'APPROVED'],
      ['APPROVED', 'FINAL'],
    ] as const;

    for (const [current, next] of [...firstCycle, ...secondCycle]) {
      expect(isAllowedReviewTransition(current, next)).toBe(true);
    }
  });

  it('does not allow FINAL to be changed directly into an editable review stage', () => {
    expect(isAllowedReviewTransition('FINAL', 'REVIEWED')).toBe(false);
    expect(isAllowedReviewTransition('FINAL', 'APPROVED')).toBe(false);
    expect(isAllowedReviewTransition('FINAL', 'READY_FOR_REVIEW')).toBe(false);
    expect(isExplicitReopen('FINAL', 'INCOMPLETE')).toBe(true);
  });

  it('does not allow skipping professional review stages', () => {
    expect(isAllowedReviewTransition('INCOMPLETE', 'APPROVED')).toBe(false);
    expect(isAllowedReviewTransition('READY_FOR_REVIEW', 'APPROVED')).toBe(false);
    expect(isAllowedReviewTransition('INCOMPLETE', 'FINAL')).toBe(false);
    expect(isAllowedReviewTransition('REVIEWED', 'FINAL')).toBe(false);
  });

  it('only permits APPROVED/FINAL to be reopened explicitly', () => {
    expect(isExplicitReopen('APPROVED', 'INCOMPLETE')).toBe(true);
    expect(isExplicitReopen('FINAL', 'INCOMPLETE')).toBe(true);
    expect(isExplicitReopen('REVIEWED', 'INCOMPLETE')).toBe(false);
  });

  it('blocks unsafe backwards transitions from FINAL and APPROVED', () => {
    expect(isAllowedReviewTransition('FINAL', 'APPROVED')).toBe(false);
    expect(isAllowedReviewTransition('FINAL', 'REVIEWED')).toBe(false);
    expect(isAllowedReviewTransition('APPROVED', 'REVIEWED')).toBe(false);
  });

  it('rejects unknown statuses', () => {
    expect(isReviewStatus('UNKNOWN')).toBe(false);
    expect(isAllowedReviewTransition('UNKNOWN', 'APPROVED')).toBe(false);
  });
});
