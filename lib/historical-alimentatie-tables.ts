/**
 * Versioned historical capacity tables.
 *
 * Values are copied from official Rechtspraak tables. Keep these datasets
 * separate from calculation code so each period remains auditable.
 */

export type HistoricalCapacityPeriod = "2024";

export type HistoricalCapacityBand = {
  period: HistoricalCapacityPeriod;
  minNbi: number;
  maxNbiExclusive?: number;
  percentage?: number;
  housingBudgetMonthly?: number;
  necessaryCostsMonthly?: number;
  capacityMonthly: number | "25/50";
  aow: boolean;
  source: string;
};

const SOURCE_2024 = "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2024";

export const DRAAGKRACHT_2024: readonly HistoricalCapacityBand[] = [
  { period: "2024", minNbi: 0, maxNbiExclusive: 1815, capacityMonthly: "25/50", aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 1815, maxNbiExclusive: 1865, percentage: 100, housingBudgetMonthly: 545, necessaryCostsMonthly: 1220, capacityMonthly: 51, aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 1865, maxNbiExclusive: 1915, percentage: 90, housingBudgetMonthly: 560, necessaryCostsMonthly: 1220, capacityMonthly: 77, aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 1915, maxNbiExclusive: 1965, percentage: 80, housingBudgetMonthly: 575, necessaryCostsMonthly: 1220, capacityMonthly: 96, aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 1965, maxNbiExclusive: 2015, percentage: 70, housingBudgetMonthly: 590, necessaryCostsMonthly: 1220, capacityMonthly: 109, aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 2015, maxNbiExclusive: 2065, percentage: 70, housingBudgetMonthly: 605, necessaryCostsMonthly: 1245, capacityMonthly: 116, aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 2065, percentage: 70, housingBudgetMonthly: 620, necessaryCostsMonthly: 1270, capacityMonthly: 123, aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 0, maxNbiExclusive: 2030, capacityMonthly: "25/50", aow: true, source: SOURCE_2024 },
  { period: "2024", minNbi: 2030, maxNbiExclusive: 2080, percentage: 90, housingBudgetMonthly: 609, necessaryCostsMonthly: 1365, capacityMonthly: 50, aow: true, source: SOURCE_2024 },
  { period: "2024", minNbi: 2080, maxNbiExclusive: 2130, percentage: 80, housingBudgetMonthly: 624, necessaryCostsMonthly: 1365, capacityMonthly: 73, aow: true, source: SOURCE_2024 },
  { period: "2024", minNbi: 2130, maxNbiExclusive: 2180, percentage: 70, housingBudgetMonthly: 639, necessaryCostsMonthly: 1365, capacityMonthly: 88, aow: true, source: SOURCE_2024 },
  { period: "2024", minNbi: 2180, maxNbiExclusive: 2230, percentage: 70, housingBudgetMonthly: 654, necessaryCostsMonthly: 1390, capacityMonthly: 95, aow: true, source: SOURCE_2024 },
  { period: "2024", minNbi: 2230, percentage: 70, housingBudgetMonthly: 669, necessaryCostsMonthly: 1415, capacityMonthly: 102, aow: true, source: SOURCE_2024 },
];

export function findHistoricalCapacityBand(year: number, nbi: number, aow = false): HistoricalCapacityBand | undefined {
  if (year !== 2024) return undefined;
  return DRAAGKRACHT_2024.find((band) =>
    band.aow === aow &&
    nbi >= band.minNbi &&
    (band.maxNbiExclusive === undefined || nbi < band.maxNbiExclusive)
  );
}

export function calculateHistoricalFormulaCapacity(year: number, nbi: number, aow = false): number | undefined {
  const band = findHistoricalCapacityBand(year, nbi, aow);
  if (!band) return undefined;
  if (typeof band.capacityMonthly === "number" && nbi < (aow ? 2230 : 2065)) return band.capacityMonthly;
  const base = aow ? 1415 : 1270;
  return Math.max(0, Math.round(0.7 * (nbi - (0.3 * nbi + base))));
}
