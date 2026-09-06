import { describe, expect, it } from 'vitest';
import { isAllowedReviewTransition, isExplicitReopen, isReviewStatus } from './review-workflow';

describe('review workflow', () => {
  it('accepts the supported professional workflow', () => {
    expect(isAllowedReviewTransition('INCOMPLETE', 'READY_FOR_REVIEW')).toBe(true);
    expect(isAllowedReviewTransition('READY_FOR_REVIEW', 'REVIEWED')).toBe(true);
    expect(isAllowedReviewTransition('REVIEWED', 'APPROVED')).toBe(true);
    expect(isAllowedReviewTransition('APPROVED', 'FINAL')).toBe(true);
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
