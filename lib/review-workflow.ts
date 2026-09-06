export const REVIEW_STATUSES = ['INCOMPLETE', 'READY_FOR_REVIEW', 'REVIEWED', 'APPROVED', 'FINAL'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const transitions: Record<ReviewStatus, readonly ReviewStatus[]> = {
  INCOMPLETE: ['INCOMPLETE', 'READY_FOR_REVIEW', 'REVIEWED', 'APPROVED'],
  READY_FOR_REVIEW: ['READY_FOR_REVIEW', 'INCOMPLETE', 'REVIEWED', 'APPROVED'],
  REVIEWED: ['REVIEWED', 'INCOMPLETE', 'APPROVED'],
  APPROVED: ['APPROVED', 'FINAL', 'INCOMPLETE'],
  FINAL: ['FINAL', 'INCOMPLETE'],
};

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === 'string' && (REVIEW_STATUSES as readonly string[]).includes(value);
}

export function isAllowedReviewTransition(current: unknown, next: unknown): boolean {
  if (!isReviewStatus(current) || !isReviewStatus(next)) return false;
  return transitions[current].includes(next);
}

export function isExplicitReopen(current: unknown, next: unknown): boolean {
  return (current === 'APPROVED' || current === 'FINAL') && next === 'INCOMPLETE';
}

export function reviewTransitionMessage(current: unknown, next: unknown): string {
  return `Reviewstatus ${String(current)} kan niet rechtstreeks worden gewijzigd naar ${String(next)}.`;
}
