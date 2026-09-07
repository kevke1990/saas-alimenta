export type ReviewCalculationBinding = {
  calculationId: string;
  fingerprint: string | null;
  engineVersion: string;
  normVersion: string;
};

export function buildReviewCalculationBinding(calculation: {
  id: string;
  engineVersion: string;
  normVersion: string;
  result: unknown;
}): ReviewCalculationBinding {
  const result = (calculation.result || {}) as Record<string, unknown>;
  const fingerprint = typeof result.calculationFingerprint === 'string' && result.calculationFingerprint.length > 0
    ? result.calculationFingerprint
    : null;

  return {
    calculationId: calculation.id,
    fingerprint,
    engineVersion: calculation.engineVersion,
    normVersion: calculation.normVersion,
  };
}

export function isReviewBindingCurrent(
  binding: Partial<ReviewCalculationBinding> | null | undefined,
  calculation: ReviewCalculationBinding,
): boolean {
  if (!binding || binding.calculationId !== calculation.calculationId) return false;
  if (binding.fingerprint !== calculation.fingerprint) return false;
  if (binding.engineVersion !== calculation.engineVersion) return false;
  return binding.normVersion === calculation.normVersion;
}
