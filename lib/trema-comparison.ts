/**
 * Read-only comparison helpers for the legacy result and the Trema 2026 audit result.
 *
 * The legacy result remains authoritative. This module only compares values that
 * have the same meaning in both engines; it never selects a production result.
 */

export type TremaComparisonStatus = "MATCH" | "DIFFERENCE" | "NOT_COMPARABLE";

export type TremaComparisonMetric = {
  key: string;
  legacyMonthly: number | null;
  tremaMonthly: number | null;
  differenceMonthly: number | null;
  comparable: boolean;
  note?: string;
};

export type TremaComparison = {
  status: TremaComparisonStatus;
  comparable: boolean;
  comparedMetricCount: number;
  missingMetricKeys: string[];
  metrics: TremaComparisonMetric[];
  warnings: string[];
};

/**
 * Only the final monthly amount is an apples-to-apples production comparison.
 * Trema's maximum contribution is payer-limited, while the legacy engine's
 * totalCapacity is a joint capacity; those values must not be compared as if
 * they represented the same quantity.
 */
const METRICS = [
  {
    key: "payableMonthly",
    note: "Eindbedrag per maand; dit is de primaire vergelijkingsmaatstaf.",
  },
] as const;

const CURRENCY_PRECISION = 100;

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * CURRENCY_PRECISION) / CURRENCY_PRECISION;
}

export function compareLegacyWithTrema(
  legacyResult: unknown,
  tremaResult: unknown,
): TremaComparison {
  const legacy = readRecord(legacyResult);
  const trema = readRecord(tremaResult);
  const warnings: string[] = [];
  const metrics = METRICS.map(({ key, note }) => {
    const legacyMonthly = readFiniteNumber(legacy[key]);
    const tremaMonthly = readFiniteNumber(trema[key]);
    return {
      key,
      legacyMonthly,
      tremaMonthly,
      differenceMonthly:
        legacyMonthly !== null && tremaMonthly !== null
          ? roundCurrency(tremaMonthly - legacyMonthly)
          : null,
      comparable: legacyMonthly !== null && tremaMonthly !== null,
      note,
    };
  });

  const comparableMetrics = metrics.filter((metric) => metric.comparable);
  const missingMetricKeys = metrics
    .filter((metric) => !metric.comparable)
    .map((metric) => metric.key);

  if (comparableMetrics.length === 0) {
    warnings.push("Het legacy- en Trema-resultaat bevatten geen gemeenschappelijk vergelijkbaar maandbedrag.");
    return {
      status: "NOT_COMPARABLE",
      comparable: false,
      comparedMetricCount: 0,
      missingMetricKeys,
      metrics,
      warnings,
    };
  }

  const status = comparableMetrics.every((metric) => metric.differenceMonthly === 0)
    ? "MATCH"
    : "DIFFERENCE";

  if (status === "DIFFERENCE") {
    warnings.push("Het eindbedrag wijkt af tussen de legacy-berekening en de Trema-audit. De legacy-uitkomst blijft leidend.");
  }

  return {
    status,
    comparable: true,
    comparedMetricCount: comparableMetrics.length,
    missingMetricKeys,
    metrics,
    warnings,
  };
}
