import {
  assertHistoricalNormExecutable,
  resolveHistoricalNormPeriod,
  type HistoricalNormPeriod,
} from "./historical-alimentatie-norms";

export type CalculationPeriodResolution = {
  requestedDate: string;
  period: HistoricalNormPeriod;
  executable: true;
};

export function resolveCalculationPeriod(calculationDate: string): CalculationPeriodResolution {
  const period = resolveHistoricalNormPeriod(calculationDate);
  if (!period) {
    throw new Error(`REVIEW_REQUIRED: geen ondersteunde alimentatienorm gevonden voor ${calculationDate}.`);
  }

  assertHistoricalNormExecutable(period);

  return {
    requestedDate: calculationDate,
    period,
    executable: true,
  };
}
