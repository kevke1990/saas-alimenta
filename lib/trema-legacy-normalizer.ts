/** Normalize the production legacy calculator result into the small shape used by the Trema audit comparator. */
export type TremaComparableLegacyResult = {
  payableMonthly: number;
  maximumContributionMonthly: number;
  payerCapacityMonthly: number;
  recipientCapacityMonthly: number;
};

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nonNegative(value: number): number {
  return Math.max(0, Math.round((value + Number.EPSILON) * 100) / 100);
}

/**
 * The legacy engine does not expose Trema's field names. Parent A is the
 * comparator's payer by convention, matching the Trema adapter; payment is
 * compared as the total monthly transfer because the legacy engine can select
 * either parent as the actual payer.
 */
export function normalizeLegacyResultForTrema(legacyResult: unknown): TremaComparableLegacyResult | null {
  if (!legacyResult || typeof legacyResult !== "object") return null;
  const result = legacyResult as Record<string, unknown>;
  const parents = Array.isArray(result.parentResults) ? result.parentResults : [];
  const transfers = Array.isArray(result.transfers) ? result.transfers : [];

  const payerCapacity = finite((parents[0] as Record<string, unknown> | undefined)?.capacity);
  const recipientCapacity = finite((parents[1] as Record<string, unknown> | undefined)?.capacity);
  const totalNeed = finite(result.totalNeed);
  const totalCapacity = finite(result.totalCapacity);
  const payable = transfers.reduce((sum, transfer) => {
    const payment = finite((transfer as Record<string, unknown>)?.payment);
    return sum + (payment ?? 0);
  }, 0);

  if (payerCapacity === null || recipientCapacity === null || totalNeed === null || totalCapacity === null) {
    return null;
  }

  return {
    payableMonthly: nonNegative(payable),
    maximumContributionMonthly: nonNegative(Math.min(totalNeed, totalCapacity)),
    payerCapacityMonthly: nonNegative(payerCapacity),
    recipientCapacityMonthly: nonNegative(recipientCapacity),
  };
}
