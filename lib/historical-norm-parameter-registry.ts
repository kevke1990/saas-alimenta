/**
 * Phase D contract for historical alimentatie norm parameters.
 *
 * This registry deliberately contains metadata and verification state only.
 * No financial values are invented here. A period can only become executable
 * after every required parameter has an explicit, reviewed source record.
 */

export type HistoricalNormParameterStatus =
  | "pending"
  | "verified";

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

export const HISTORICAL_NORM_PARAMETER_RECORDS: readonly HistoricalNormParameterRecord[] = [];

export function getHistoricalNormParameterRecords(periodId: string) {
  return HISTORICAL_NORM_PARAMETER_RECORDS.filter((record) => record.periodId === periodId);
}

export function isHistoricalNormParameterSetComplete(periodId: string): boolean {
  const records = getHistoricalNormParameterRecords(periodId);
  return HISTORICAL_NORM_PARAMETER_KEYS.every((key) =>
    records.some((record) => record.key === key && record.status === "verified")
  );
}

export function assertHistoricalNormParameterSetComplete(periodId: string): void {
  if (!isHistoricalNormParameterSetComplete(periodId)) {
    throw new Error(
      `REVIEW_REQUIRED: historische normparameter-set ${periodId} is niet volledig en mag niet worden uitgevoerd.`
    );
  }
}
