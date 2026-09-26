/**
 * Versioned historical capacity tables.
 *
 * Values are copied from official Rechtspraak tables. Keep these datasets
 * separate from calculation code so each period remains auditable.
 */

export type HistoricalCapacityPeriod = "2020" | "2021" | "2022" | "2023" | "2024";

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

const SOURCE_2020 = "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/archief";
const SOURCE_2021 = "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2021";
const SOURCE_2022 = "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2022";
const SOURCE_2023 = "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2023";
const SOURCE_2024 = "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2024";

export const DRAAGKRACHT_HISTORICAL: readonly HistoricalCapacityBand[] = [
  { period: "2020", minNbi: 0, maxNbiExclusive: 1410, capacityMonthly: "25/50", aow: false, source: SOURCE_2020 },
  { period: "2020", minNbi: 1410, maxNbiExclusive: 1460, capacityMonthly: 62, aow: false, source: SOURCE_2020 },
  { period: "2020", minNbi: 1460, maxNbiExclusive: 1510, capacityMonthly: 87, aow: false, source: SOURCE_2020 },
  { period: "2020", minNbi: 1510, maxNbiExclusive: 1560, capacityMonthly: 106, aow: false, source: SOURCE_2020 },
  { period: "2020", minNbi: 1560, maxNbiExclusive: 1610, capacityMonthly: 117, aow: false, source: SOURCE_2020 },
  { period: "2020", minNbi: 1610, maxNbiExclusive: 1660, capacityMonthly: 124, aow: false, source: SOURCE_2020 },
  { period: "2020", minNbi: 1660, capacityMonthly: 131, aow: false, source: SOURCE_2020 },
  { period: "2020", minNbi: 0, maxNbiExclusive: 1600, capacityMonthly: "25/50", aow: true, source: SOURCE_2020 },
  { period: "2020", minNbi: 1600, maxNbiExclusive: 1650, capacityMonthly: 63, aow: true, source: SOURCE_2020 },
  { period: "2020", minNbi: 1650, maxNbiExclusive: 1700, capacityMonthly: 84, aow: true, source: SOURCE_2020 },
  { period: "2020", minNbi: 1700, maxNbiExclusive: 1750, capacityMonthly: 98, aow: true, source: SOURCE_2020 },
  { period: "2020", minNbi: 1750, maxNbiExclusive: 1800, capacityMonthly: 105, aow: true, source: SOURCE_2020 },
  { period: "2020", minNbi: 1800, capacityMonthly: 112, aow: true, source: SOURCE_2020 },
  { period: "2021", minNbi: 0, maxNbiExclusive: 1450, capacityMonthly: "25/50", aow: false, source: SOURCE_2021 },
  { period: "2021", minNbi: 1450, maxNbiExclusive: 1500, capacityMonthly: 65, aow: false, source: SOURCE_2021 },
  { period: "2021", minNbi: 1500, maxNbiExclusive: 1550, capacityMonthly: 90, aow: false, source: SOURCE_2021 },
  { period: "2021", minNbi: 1550, maxNbiExclusive: 1600, capacityMonthly: 108, aow: false, source: SOURCE_2021 },
  { period: "2021", minNbi: 1600, maxNbiExclusive: 1650, capacityMonthly: 119, aow: false, source: SOURCE_2021 },
  { period: "2021", minNbi: 1650, maxNbiExclusive: 1700, capacityMonthly: 126, aow: false, source: SOURCE_2021 },
  { period: "2021", minNbi: 1700, capacityMonthly: 133, aow: false, source: SOURCE_2021 },
  { period: "2021", minNbi: 0, maxNbiExclusive: 1625, capacityMonthly: "25/50", aow: true, source: SOURCE_2021 },
  { period: "2021", minNbi: 1625, maxNbiExclusive: 1675, capacityMonthly: 61, aow: true, source: SOURCE_2021 },
  { period: "2021", minNbi: 1675, maxNbiExclusive: 1725, capacityMonthly: 82, aow: true, source: SOURCE_2021 },
  { period: "2021", minNbi: 1725, maxNbiExclusive: 1775, capacityMonthly: 96, aow: true, source: SOURCE_2021 },
  { period: "2021", minNbi: 1775, maxNbiExclusive: 1825, capacityMonthly: 103, aow: true, source: SOURCE_2021 },
  { period: "2021", minNbi: 1825, capacityMonthly: 110, aow: true, source: SOURCE_2021 },
  { period: "2022", minNbi: 0, maxNbiExclusive: 1470, capacityMonthly: "25/50", aow: false, source: SOURCE_2022 },
  { period: "2022", minNbi: 1470, maxNbiExclusive: 1520, capacityMonthly: 59, aow: false, source: SOURCE_2022 },
  { period: "2022", minNbi: 1520, maxNbiExclusive: 1570, capacityMonthly: 85, aow: false, source: SOURCE_2022 },
  { period: "2022", minNbi: 1570, maxNbiExclusive: 1620, capacityMonthly: 103, aow: false, source: SOURCE_2022 },
  { period: "2022", minNbi: 1620, maxNbiExclusive: 1670, capacityMonthly: 115, aow: false, source: SOURCE_2022 },
  { period: "2022", minNbi: 1670, maxNbiExclusive: 1720, capacityMonthly: 122, aow: false, source: SOURCE_2022 },
  { period: "2022", minNbi: 1720, capacityMonthly: 129, aow: false, source: SOURCE_2022 },
  { period: "2022", minNbi: 0, maxNbiExclusive: 1645, capacityMonthly: "25/50", aow: true, source: SOURCE_2022 },
  { period: "2022", minNbi: 1645, maxNbiExclusive: 1695, capacityMonthly: 55, aow: true, source: SOURCE_2022 },
  { period: "2022", minNbi: 1695, maxNbiExclusive: 1745, capacityMonthly: 77, aow: true, source: SOURCE_2022 },
  { period: "2022", minNbi: 1745, maxNbiExclusive: 1795, capacityMonthly: 92, aow: true, source: SOURCE_2022 },
  { period: "2022", minNbi: 1795, maxNbiExclusive: 1845, capacityMonthly: 99, aow: true, source: SOURCE_2022 },
  { period: "2022", minNbi: 1845, capacityMonthly: 106, aow: true, source: SOURCE_2022 },
  { period: "2023", minNbi: 0, maxNbiExclusive: 1680, capacityMonthly: "25/50", aow: false, source: SOURCE_2023 },
  { period: "2023", minNbi: 1680, maxNbiExclusive: 1730, capacityMonthly: 51, aow: false, source: SOURCE_2023 },
  { period: "2023", minNbi: 1730, maxNbiExclusive: 1780, capacityMonthly: 77, aow: false, source: SOURCE_2023 },
  { period: "2023", minNbi: 1780, maxNbiExclusive: 1830, capacityMonthly: 97, aow: false, source: SOURCE_2023 },
  { period: "2023", minNbi: 1830, maxNbiExclusive: 1880, capacityMonthly: 109, aow: false, source: SOURCE_2023 },
  { period: "2023", minNbi: 1880, maxNbiExclusive: 1930, capacityMonthly: 116, aow: false, source: SOURCE_2023 },
  { period: "2023", minNbi: 1930, capacityMonthly: 123, aow: false, source: SOURCE_2023 },
  { period: "2023", minNbi: 0, maxNbiExclusive: 1890, capacityMonthly: "25/50", aow: true, source: SOURCE_2023 },
  { period: "2023", minNbi: 1890, maxNbiExclusive: 1940, capacityMonthly: 52, aow: true, source: SOURCE_2023 },
  { period: "2023", minNbi: 1940, maxNbiExclusive: 1990, capacityMonthly: 74, aow: true, source: SOURCE_2023 },
  { period: "2023", minNbi: 1990, maxNbiExclusive: 2040, capacityMonthly: 90, aow: true, source: SOURCE_2023 },
  { period: "2023", minNbi: 2040, maxNbiExclusive: 2090, capacityMonthly: 97, aow: true, source: SOURCE_2023 },
  { period: "2023", minNbi: 2090, capacityMonthly: 104, aow: true, source: SOURCE_2023 },
  { period: "2024", minNbi: 0, maxNbiExclusive: 1815, capacityMonthly: "25/50", aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 1815, maxNbiExclusive: 1865, capacityMonthly: 51, aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 1865, maxNbiExclusive: 1915, capacityMonthly: 77, aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 1915, maxNbiExclusive: 1965, capacityMonthly: 96, aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 1965, maxNbiExclusive: 2015, capacityMonthly: 109, aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 2015, maxNbiExclusive: 2065, capacityMonthly: 116, aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 2065, capacityMonthly: 123, aow: false, source: SOURCE_2024 },
  { period: "2024", minNbi: 0, maxNbiExclusive: 2030, capacityMonthly: "25/50", aow: true, source: SOURCE_2024 },
  { period: "2024", minNbi: 2030, maxNbiExclusive: 2080, capacityMonthly: 50, aow: true, source: SOURCE_2024 },
  { period: "2024", minNbi: 2080, maxNbiExclusive: 2130, capacityMonthly: 73, aow: true, source: SOURCE_2024 },
  { period: "2024", minNbi: 2130, maxNbiExclusive: 2180, capacityMonthly: 88, aow: true, source: SOURCE_2024 },
  { period: "2024", minNbi: 2180, maxNbiExclusive: 2230, capacityMonthly: 95, aow: true, source: SOURCE_2024 },
  { period: "2024", minNbi: 2230, capacityMonthly: 102, aow: true, source: SOURCE_2024 },
];

const FORMULA_BASE: Record<HistoricalCapacityPeriod, { aow: number; nonAow: number }> = {
  "2020": { aow: 1100, nonAow: 975 },
  "2021": { aow: 1120, nonAow: 1000 },
  "2022": { aow: 1140, nonAow: 1020 },
  "2023": { aow: 1315, nonAow: 1175 },
  "2024": { aow: 1415, nonAow: 1270 },
};

const FORMULA_THRESHOLD: Record<HistoricalCapacityPeriod, { aow: number; nonAow: number }> = {
  "2020": { aow: 1800, nonAow: 1660 },
  "2021": { aow: 1825, nonAow: 1700 },
  "2022": { aow: 1845, nonAow: 1720 },
  "2023": { aow: 2090, nonAow: 1930 },
  "2024": { aow: 2230, nonAow: 2065 },
};

export function findHistoricalCapacityBand(year: number, nbi: number, aow = false): HistoricalCapacityBand | undefined {
  return DRAAGKRACHT_HISTORICAL.find((band) =>
    Number(band.period) === year &&
    band.aow === aow &&
    nbi >= band.minNbi &&
    (band.maxNbiExclusive === undefined || nbi < band.maxNbiExclusive)
  );
}

export function calculateHistoricalFormulaCapacity(year: number, nbi: number, aow = false): number | undefined {
  const band = findHistoricalCapacityBand(year, nbi, aow);
  if (!band) return undefined;
  const period = band.period;
  const threshold = aow ? FORMULA_THRESHOLD[period].aow : FORMULA_THRESHOLD[period].nonAow;
  if (typeof band.capacityMonthly === "number" && nbi < threshold) return band.capacityMonthly;
  const base = aow ? FORMULA_BASE[period].aow : FORMULA_BASE[period].nonAow;
  return Math.max(0, Math.round(0.7 * (nbi - (0.3 * nbi + base))));
}
