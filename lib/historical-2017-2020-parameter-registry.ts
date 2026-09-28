export type HistoricalCapacityBand = {
  maxNbi: number | null;
  percentage: number;
  fixedAmount?: number;
};

export type HistoricalCapacityPeriod = {
  validFrom: string;
  validTo: string;
  source: string;
  bands: HistoricalCapacityBand[];
};

/**
 * Registry contract for historical capacity parameters.
 *
 * Numeric entries are intentionally populated only when verified against the
 * corresponding primary source. Missing periods must fail closed rather than
 * silently falling back to a modern parameter set.
 */
export const HISTORICAL_2017_2020: Record<string, HistoricalCapacityPeriod[]> = {
  2017: [],
  2018: [],
  2019: [],
  2020: [],
};

export function getHistoricalCapacityPeriod(date: string): HistoricalCapacityPeriod | null {
  const year = Number(date.slice(0, 4));
  const periods = HISTORICAL_2017_2020[String(year)];
  if (!periods) return null;
  return periods.find((period) => date >= period.validFrom && date <= period.validTo) ?? null;
}
