import { buildReviewCalculationBinding, type ReviewCalculationBinding } from './review-binding';

export type ReportProvenance = {
  calculation: ReviewCalculationBinding | null;
  review: {
    status: string;
    score: number | null;
    approvedAt: string | null;
    approvedByUserId: string | null;
    boundToApprovedCalculation: boolean;
  };
  integrity: {
    fingerprintPresent: boolean;
    snapshotPresent: boolean;
  };
};

export function buildReportProvenance(input: {
  calculation?: { id: string; engineVersion: string; normVersion: string; result: unknown } | null;
  reviewStatus?: string | null;
  reviewScore?: number | null;
  approvedAt?: Date | string | null;
  approvedByUserId?: string | null;
  approvalBinding?: Partial<ReviewCalculationBinding> | null;
}): ReportProvenance {
  const calculation = input.calculation ? buildReviewCalculationBinding(input.calculation) : null;
  const bound = Boolean(calculation && input.approvalBinding &&
    input.approvalBinding.calculationId === calculation.calculationId &&
    input.approvalBinding.fingerprint === calculation.fingerprint &&
    input.approvalBinding.engineVersion === calculation.engineVersion &&
    input.approvalBinding.normVersion === calculation.normVersion);

  return {
    calculation,
    review: {
      status: String(input.reviewStatus || 'INCOMPLETE'),
      score: typeof input.reviewScore === 'number' && Number.isFinite(input.reviewScore) ? input.reviewScore : null,
      approvedAt: input.approvedAt ? new Date(input.approvedAt).toISOString() : null,
      approvedByUserId: input.approvedByUserId || null,
      boundToApprovedCalculation: bound,
    },
    integrity: {
      fingerprintPresent: Boolean(calculation?.fingerprint),
      snapshotPresent: Boolean(calculation?.calculationId),
    },
  };
}
