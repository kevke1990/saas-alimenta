/**
 * Historical norm parameter registry.
 *
 * This registry is intentionally metadata-only for historical years. The
 * existing 2024-2026 executable norm sets remain the single source of truth
 * for currently supported calculations. Historical years stay fail-closed
 * until every required parameter has been independently verified.
 */

import { NORM_SETS, type NormYear } from "./norms";

export type HistoricalNormParameterStatus = "pending" | "verified";

export type HistoricalNormParameterKey =
  | "tableAmount"
  | "childBudget"
  | "incomeTaxParameters"
  | "socialPremiumParameters"
  | "minimumIncome"
  | "careReduction"
  | "otherRequiredNormInputs";

export type HistoricalNormParameterRecord = {
  periodId: string;
  key: HistoricalNormParameterKey;
  status: HistoricalNormParameterStatus;
  sourceUrl: string;
  sourceLocator: string;
  sourceDate?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
};

export const HISTORICAL_NORM_PARAMETER_KEYS: readonly HistoricalNormParameterKey[] = [
  "tableAmount",
  "childBudget",
  "incomeTaxParameters",
  "socialPremiumParameters",
  "minimumIncome",
  "careReduction",
  "otherRequiredNormInputs",
];

/**
 * Historical records are deliberately empty until the official values have
 * been extracted and reviewed. Never infer them from a current NormSet.
 */
export const HISTORICAL_NORM_PARAMETER_RECORDS: readonly HistoricalNormParameterRecord[] = [];

export function getHistoricalNormParameterRecords(periodId: string): readonly HistoricalNormParameterRecord[] {
  return HISTORICAL_NORM_PARAMETER_RECORDS.filter((record) => record.periodId === periodId);
}

export function isHistoricalNormParameterSetComplete(periodId: string): boolean {
  const records = getHistoricalNormParameterRecords(periodId);
  return HISTORICAL_NORM_PARAMETER_KEYS.every((key) =>
    records.some((record) => record.key === key && record.status === "verified"),
  );
}

export function isExecutableCurrentNormPeriod(periodId: string): boolean {
  const match = /^(2024|2025|2026)(?:-H[12])?$/.exec(periodId);
  if (!match) return false;
  const year = Number(match[1]) as NormYear;
  return Boolean(NORM_SETS[year]);
}

export function isNormPeriodExecutable(periodId: string): boolean {
  return isExecutableCurrentNormPeriod(periodId) || isHistoricalNormParameterSetComplete(periodId);
}

export function assertHistoricalNormParameterSetComplete(periodId: string): void {
  if (!isHistoricalNormParameterSetComplete(periodId)) {
    throw new Error(
      `REVIEW_REQUIRED: historische normparameter-set ${periodId} is niet volledig en mag niet worden uitgevoerd.`,
    );
  }
}

export function assertNormPeriodExecutable(periodId: string): void {
  if (!isNormPeriodExecutable(periodId)) {
    throw new Error(
      `REVIEW_REQUIRED: normperiode ${periodId} heeft geen volledig geverifieerde uitvoerbare normset.`,
    );
  }
}
