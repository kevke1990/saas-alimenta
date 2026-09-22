export type ChildCostShareResolution = {
  payerIndex: 0 | 1;
  childCostShare: number;
  source: "CHILD_CALCULATION" | "MANUAL_OVERRIDE";
};

type ChildResult = {
  parentResults?: Array<{ parentIndex?: number; allocatedNeed?: number }>;
};

/**
 * Resolve the amount that has priority over partner-support capacity.
 * This is the parent's allocated share in the children's costs, not the
 * eventual transfer/payment amount. A professional override is explicit and
 * remains traceable.
 */
export function resolveChildCostShare(
  childResult: ChildResult,
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

/**
 * Resolve the child-cost share from either the current combined result shape
 * or a legacy child result. This keeps standalone PAL endpoints on the same
 * semantic input as the integrated case calculation.
 */
export function resolveChildCostShareFromCaseResult(
  result: any,
  payerIndex: 0 | 1,
  manualOverride?: unknown,
): ChildCostShareResolution | null {
  if (!result || typeof result !== "object") return null;

  const combinedShares = result.combined?.childCostShareByParent;
  const childResult: ChildResult = Array.isArray(combinedShares)
    ? {
        parentResults: [0, 1].map(parentIndex => ({
          parentIndex,
          allocatedNeed: Number(combinedShares[parentIndex] ?? 0),
        })),
      }
    : result;

  if (!Array.isArray(childResult.parentResults)) return null;
  return resolveChildCostShare(childResult, payerIndex, manualOverride);
}
