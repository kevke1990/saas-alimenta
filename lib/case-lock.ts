export const LOCKED_REVIEW_STATUSES = ['APPROVED', 'FINAL'] as const;

export function isCaseLockedForCalculation(reviewStatus: unknown): boolean {
  return LOCKED_REVIEW_STATUSES.includes(String(reviewStatus) as (typeof LOCKED_REVIEW_STATUSES)[number]);
}

export function calculationLockMessage(reviewStatus: unknown): string {
  return `Dit dossier is ${String(reviewStatus)} en is vergrendeld voor directe herberekening. Open het dossier eerst opnieuw voor wijziging.`;
}
