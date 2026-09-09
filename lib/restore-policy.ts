import { isCaseLockedForCalculation } from "./case-lock";

export function canRestoreCalculation(reviewStatus?: string | null): boolean {
  return !isCaseLockedForCalculation(reviewStatus);
}

export function restoredReviewStatus(): "INCOMPLETE" {
  return "INCOMPLETE";
}

export function restoreCreatesNewSnapshot(): true {
  return true;
}
