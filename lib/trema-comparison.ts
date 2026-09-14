/**
 * Read-only comparison helpers for the legacy result and the Trema 2026 audit result.
 *
 * The legacy result remains authoritative. This module only normalises comparable
 * monthly amounts and reports differences; it never selects a production result.
 */

export type TremaComparisonStatus = "MATCH" | "DIFFERENCE" | "NOT_COMPARABLE";

export type TremaComparisonMetric = {
  key: string;
  legacyMonthly: number | null;
  tremaMonthly: number | null;
  differenceMonthly: number | null;
};

export type TremaComparison = {
  status: TremaComparisonStatus;
  comparable: boolean;
  metrics: TremaComparisonMetric[];
  warnings: string[];
};

const MONTHLY_KEYS = [
  "payableMonthly",
  "maximumContributionMonthly",
  "payerCapacityMonthly",
  "recipientCapacityMonthly",
] as const;

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
}

/**
 * Compare known monthly result fields without making assumptions about the
 * legacy calculator's complete result shape.
 */
export function compareLegacyWithTrema(
  legacyResult: unknown,
  tremaResult: unknown,
): TremaComparison {
  const legacy = readRecord(legacyResult);
  const trema = readRecord(tremaResult);
  const warnings: string[] = [];
  const metrics = MONTHLY_KEYS.map((key) => {
    const legacyMonthly = readFiniteNumber(legacy[key]);
    const tremaMonthly = readFiniteNumber(trema[key]);
    return {
      key,
      legacyMonthly,
      tremaMonthly,
      differenceMonthly:
        legacyMonthly !== null && tremaMonthly !== null
          ? Math.round((tremaMonthly - legacyMonthly + Number.EPSILON) * 100) / 100
          : null,
    };
  });

  const comparable = metrics.some(
    (metric) => metric.legacyMonthly !== null && metric.tremaMonthly !== null,
  );

  if (!comparable) {
    warnings.push("De legacy- en Trema-uitkomst bevatten geen gemeenschappelijk vergelijkbaar maandbedrag.");
    return { status: "NOT_COMPARABLE", comparable: false, metrics, warnings };
  }

  const status = metrics.every(
    (metric) =>
      metric.legacyMonthly === null ||
      metric.tremaMonthly === null ||
      metric.differenceMonthly === 0,
  )
    ? "MATCH"
    : "DIFFERENCE";

  if (status === "DIFFERENCE") {
    warnings.push("Er is een afwijking tussen de legacy-uitkomst en de Trema-audituitkomst. De legacy-uitkomst blijft leidend.");
  }

  return { status, comparable: true, metrics, warnings };
}
