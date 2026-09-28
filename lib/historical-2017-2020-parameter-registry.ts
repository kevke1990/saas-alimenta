export type HistoricalCapacityBand = {
  maxNbi: number | null;
  percentage: number;
  fixedAmount?: number;
};

export type HistoricalCapacityPeriod = {
  validFrom: string;
  validTo: string;
  source: string;
  status: 'verified' | 'pending';
  bands: HistoricalCapacityBand[];
};

/**
 * Registry contract for historical capacity parameters.
 * Numeric entries are populated only after primary-source verification.
 * Missing/unverified periods must fail closed rather than silently falling back.
 */
export const HISTORICAL_2017_2020: Record<string, HistoricalCapacityPeriod[]> = {
  2017: [{ validFrom: '2017-01-01', validTo: '2017-12-31', source: 'Rechtspraak Tremarapport 2017 / draagkrachttabel', status: 'pending', bands: [] }],
  2018: [{ validFrom: '2018-01-01', validTo: '2018-12-31', source: 'Rechtspraak Tremarapport 2018 / draagkrachttabel', status: 'pending', bands: [] }],
  2019: [{ validFrom: '2019-01-01', validTo: '2019-12-31', source: 'Rechtspraak Tremarapport 2019 / draagkrachttabel', status: 'pending', bands: [] }],
  2020: [{ validFrom: '2020-01-01', validTo: '2020-12-31', source: 'Rechtspraak Tremarapport 2020 / draagkrachttabel', status: 'pending', bands: [] }],
};

export function getHistoricalCapacityPeriod(date: string): HistoricalCapacityPeriod | null {
  const year = Number(date.slice(0, 4));
  const periods = HISTORICAL_2017_2020[String(year)];
  if (!periods) return null;
  return periods.find((period) => date >= period.validFrom && date <= period.validTo) ?? null;
}

export function assertHistoricalCapacityVerified(period: HistoricalCapacityPeriod): void {
  if (period.status !== 'verified' || period.bands.length === 0) {
    throw new Error(`Historical capacity parameters for ${period.validFrom.slice(0, 4)} are not verified`);
  }
}
