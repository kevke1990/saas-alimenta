/**
 * Structural validation for the historical norm source catalog.
 *
 * This validates provenance metadata only. It deliberately does not infer or
 * promote financial parameters: a period remains non-executable until its
 * parameter registry is independently verified.
 */

import {
  HISTORICAL_NORM_SOURCE_CATALOG,
  type NormSourcePeriod,
} from "./historical-norm-source-catalog";

export type SourceCatalogIssue = {
  year: number;
  code:
    | "invalid_range"
    | "overlap"
    | "gap"
    | "missing_report"
    | "missing_period_detail";
  message: string;
};

function toDay(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

export function validateHistoricalNormSourceCatalog(
  periods: readonly NormSourcePeriod[] = HISTORICAL_NORM_SOURCE_CATALOG,
): SourceCatalogIssue[] {
  const issues: SourceCatalogIssue[] = [];
  const sorted = [...periods].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));

  for (const period of sorted) {
    if (toDay(period.effectiveFrom) > toDay(period.effectiveTo)) {
      issues.push({
        year: period.year,
        code: "invalid_range",
        message: "effectiveFrom must not be after effectiveTo",
      });
    }

    if (!period.reportJanuary) {
      issues.push({
        year: period.year,
        code: "missing_report",
        message: "A January/source report is required for every catalogued period",
      });
    }

    if (!period.needTable && !period.capacityTable) {
      issues.push({
        year: period.year,
        code: "missing_period_detail",
        message: "At least one period-specific need or capacity source is required",
      });
    }
  }

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const previousEnd = toDay(previous.effectiveTo);
    const currentStart = toDay(current.effectiveFrom);
    const oneDay = 24 * 60 * 60 * 1000;

    if (currentStart <= previousEnd) {
      issues.push({
        year: current.year,
        code: "overlap",
        message: `Period overlaps the preceding catalogued period (${previous.year})`,
      });
    } else if (currentStart !== previousEnd + oneDay) {
      issues.push({
        year: current.year,
        code: "gap",
        message: `Period starts after a gap following ${previous.year}`,
      });
    }
  }

  return issues;
}

export function assertHistoricalNormSourceCatalogIsStructurallyValid(
  periods: readonly NormSourcePeriod[] = HISTORICAL_NORM_SOURCE_CATALOG,
): void {
  const issues = validateHistoricalNormSourceCatalog(periods);
  if (issues.length > 0) {
    throw new Error(
      `Historical norm source catalog is invalid: ${issues
        .map((issue) => `${issue.year}:${issue.code}:${issue.message}`)
        .join("; ")}`,
    );
  }
}
