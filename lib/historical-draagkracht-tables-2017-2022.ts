/**
 * Historical child-support capacity tables (2017-2022).
 *
 * Sources: official Rechtspraak draagkrachttabellen. These are deliberately
 * modeled as source data, not as a fallback to the current-year engine.
 * H1/H2 period resolution remains a separate concern because other norm
 * inputs can change at the half-year boundary.
 */
export type HistoricalCapacityYear = 2017 | 2018 | 2019 | 2020 | 2021 | 2022;

export type CapacityFormulaBand = {
  fromNbi: number;
  percentage: number;
  fixedOffset: number;
};

export type HistoricalCapacityTable = {
  year: HistoricalCapacityYear;
  sourceUrl: string;
  minimumNbi: number;
  minimumCapacity: number;
  bands: readonly CapacityFormulaBand[];
};

export const HISTORICAL_CAPACITY_TABLES_2017_2022: readonly HistoricalCapacityTable[] = [
  {
    year: 2017,
    sourceUrl: "https://www.rechtspraak.nl/binaries/content/assets/lbvr/an/lbvr-an-draagkrachttabel-2017.pdf",
    minimumNbi: 1325,
    minimumCapacity: 25,
    bands: [
      { fromNbi: 1325, percentage: 100, fixedOffset: 855 },
      { fromNbi: 1375, percentage: 90, fixedOffset: 855 },
      { fromNbi: 1425, percentage: 80, fixedOffset: 855 },
      { fromNbi: 1475, percentage: 70, fixedOffset: 855 },
      { fromNbi: 1525, percentage: 70, fixedOffset: 880 },
      { fromNbi: 1575, percentage: 70, fixedOffset: 905 },
    ],
  },
  {
    year: 2018,
    sourceUrl: "https://www.rechtspraak.nl/binaries/content/assets/lbvr/an/lbvr-an-draagkrachttabel-alimentatie-2018.pdf",
    minimumNbi: 1350,
    minimumCapacity: 25,
    bands: [
      { fromNbi: 1350, percentage: 100, fixedOffset: 870 },
      { fromNbi: 1400, percentage: 90, fixedOffset: 870 },
      { fromNbi: 1450, percentage: 80, fixedOffset: 870 },
      { fromNbi: 1500, percentage: 70, fixedOffset: 870 },
      { fromNbi: 1550, percentage: 70, fixedOffset: 895 },
      { fromNbi: 1600, percentage: 70, fixedOffset: 920 },
    ],
  },
  {
    year: 2019,
    sourceUrl: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/archief",
    minimumNbi: 1375,
    minimumCapacity: 25,
    bands: [
      { fromNbi: 1375, percentage: 100, fixedOffset: 900 },
      { fromNbi: 1425, percentage: 90, fixedOffset: 900 },
      { fromNbi: 1475, percentage: 80, fixedOffset: 900 },
      { fromNbi: 1525, percentage: 70, fixedOffset: 900 },
      { fromNbi: 1575, percentage: 70, fixedOffset: 925 },
      { fromNbi: 1625, percentage: 70, fixedOffset: 950 },
    ],
  },
  {
    year: 2020,
    sourceUrl: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/archief",
    minimumNbi: 1410,
    minimumCapacity: 25,
    bands: [
      { fromNbi: 1410, percentage: 100, fixedOffset: 925 },
      { fromNbi: 1460, percentage: 90, fixedOffset: 925 },
      { fromNbi: 1510, percentage: 80, fixedOffset: 925 },
      { fromNbi: 1560, percentage: 70, fixedOffset: 925 },
      { fromNbi: 1610, percentage: 70, fixedOffset: 950 },
      { fromNbi: 1660, percentage: 70, fixedOffset: 975 },
    ],
  },
  {
    year: 2021,
    sourceUrl: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2021",
    minimumNbi: 1450,
    minimumCapacity: 25,
    bands: [
      { fromNbi: 1450, percentage: 100, fixedOffset: 950 },
      { fromNbi: 1500, percentage: 90, fixedOffset: 950 },
      { fromNbi: 1550, percentage: 80, fixedOffset: 950 },
      { fromNbi: 1600, percentage: 70, fixedOffset: 950 },
      { fromNbi: 1650, percentage: 70, fixedOffset: 975 },
      { fromNbi: 1700, percentage: 70, fixedOffset: 1000 },
    ],
  },
  {
    year: 2022,
    sourceUrl: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2022",
    minimumNbi: 1470,
    minimumCapacity: 25,
    bands: [
      { fromNbi: 1470, percentage: 100, fixedOffset: 970 },
      { fromNbi: 1520, percentage: 90, fixedOffset: 970 },
      { fromNbi: 1570, percentage: 80, fixedOffset: 970 },
      { fromNbi: 1620, percentage: 70, fixedOffset: 970 },
      { fromNbi: 1670, percentage: 70, fixedOffset: 995 },
      { fromNbi: 1720, percentage: 70, fixedOffset: 1020 },
    ],
  },
];

export function getHistoricalCapacityTable(year: HistoricalCapacityYear): HistoricalCapacityTable {
  const table = HISTORICAL_CAPACITY_TABLES_2017_2022.find((candidate) => candidate.year === year);
  if (!table) throw new Error(`REVIEW_REQUIRED: historische draagkrachttabel ontbreekt voor ${year}`);
  return table;
}

/**
 * Calculates the formula result for an NBI. The published low-income table
 * values remain authoritative at the band boundaries; this function is used
 * only for the formula bands above those boundaries.
 */
export function calculateHistoricalCapacity(year: HistoricalCapacityYear, nbi: number): number {
  if (!Number.isFinite(nbi) || nbi < 0) throw new Error("REVIEW_REQUIRED: ongeldig NBI");
  const table = getHistoricalCapacityTable(year);
  if (nbi < table.minimumNbi) return table.minimumCapacity;
  const band = [...table.bands].reverse().find((candidate) => nbi >= candidate.fromNbi);
  if (!band) return table.minimumCapacity;
  return Math.max(0, Math.round((band.percentage / 100) * (nbi - (0.3 * nbi + band.fixedOffset))));
}
