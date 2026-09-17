export type ChildCostShareResolution = {
  payerIndex: 0 | 1;
  childCostShare: number;
  source: "CHILD_CALCULATION" | "MANUAL_OVERRIDE";
};

/**
 * Resolve the amount that has priority over partner-support capacity.
 * This is the parent's allocated share in the children's costs, not the
 * eventual transfer/payment amount. A professional override is explicit and
 * remains traceable.
 */
export function resolveChildCostShare(
  childResult: { parentResults?: Array<{ parentIndex?: number; allocatedNeed?: number }> },
  payerIndex: 0 | 1,
  manualOverride?: unknown,
): ChildCostShareResolution {
  const parent = childResult.parentResults?.find(candidate => Number(candidate.parentIndex) === payerIndex);
  const calculated = Number(parent?.allocatedNeed ?? 0);
  const override = Number(manualOverride);
  const hasOverride = manualOverride !== undefined && Number.isFinite(override) && override >= 0;

  return {
    payerIndex,
    childCostShare: Math.round(Math.max(0, hasOverride ? override : calculated)),
    source: hasOverride ? "MANUAL_OVERRIDE" : "CHILD_CALCULATION",
  };
}
