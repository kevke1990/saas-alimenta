/**
 * Historical child-support capacity tables (2017-2022), for people below AOW age.
 *
 * The published low-income table amounts are used up to each year's formula
 * threshold. Below the first threshold, the minimum depends on whether the
 * obligation concerns one child or two or more children. Above the threshold,
 * the year-specific formula bands apply.
 */
export type HistoricalCapacityYear = 2017 | 2018 | 2019 | 2020 | 2021 | 2022;

export type CapacityFormulaBand = {
  fromNbi: number;
  percentage: number;
  fixedOffset: number;
};

export type HistoricalFixedCapacityBand = {
  fromNbi: number;
  toNbi: number;
  capacity: number;
};

export type HistoricalCapacityTable = {
  year: HistoricalCapacityYear;
  sourceUrl: string;
  minimumNbi: number;
  formulaStartNbi: number;
  minimumCapacity: { oneChild: 25; twoOrMoreChildren: 50 };
  fixedCapacityBands: readonly HistoricalFixedCapacityBand[];
  bands: readonly CapacityFormulaBand[];
};

export const HISTORICAL_CAPACITY_TABLES_2017_2022: readonly HistoricalCapacityTable[] = [
  {
    year: 2017,
    sourceUrl: "https://www.rechtspraak.nl/binaries/content/assets/lbvr/an/lbvr-an-draagkrachttabel-2017.pdf",
    minimumNbi: 1325,
    formulaStartNbi: 1550,
    minimumCapacity: { oneChild: 25, twoOrMoreChildren: 50 },
    fixedCapacityBands: [
      { fromNbi: 1325, toNbi: 1375, capacity: 73 },
      { fromNbi: 1375, toNbi: 1425, capacity: 97 },
      { fromNbi: 1425, toNbi: 1475, capacity: 114 },
      { fromNbi: 1475, toNbi: 1525, capacity: 124 },
      { fromNbi: 1525, toNbi: 1550, capacity: 131 },
    ],
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
    formulaStartNbi: 1600,
    minimumCapacity: { oneChild: 25, twoOrMoreChildren: 50 },
    fixedCapacityBands: [
      { fromNbi: 1350, toNbi: 1400, capacity: 75 },
      { fromNbi: 1400, toNbi: 1450, capacity: 99 },
      { fromNbi: 1450, toNbi: 1500, capacity: 116 },
      { fromNbi: 1500, toNbi: 1550, capacity: 126 },
      { fromNbi: 1550, toNbi: 1600, capacity: 133 },
    ],
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
    formulaStartNbi: 1625,
    minimumCapacity: { oneChild: 25, twoOrMoreChildren: 50 },
    fixedCapacityBands: [
      { fromNbi: 1375, toNbi: 1425, capacity: 63 },
      { fromNbi: 1425, toNbi: 1475, capacity: 88 },
      { fromNbi: 1475, toNbi: 1525, capacity: 106 },
      { fromNbi: 1525, toNbi: 1575, capacity: 117 },
      { fromNbi: 1575, toNbi: 1625, capacity: 124 },
    ],
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
    formulaStartNbi: 1660,
    minimumCapacity: { oneChild: 25, twoOrMoreChildren: 50 },
    fixedCapacityBands: [
      { fromNbi: 1410, toNbi: 1460, capacity: 62 },
      { fromNbi: 1460, toNbi: 1510, capacity: 87 },
      { fromNbi: 1510, toNbi: 1560, capacity: 106 },
      { fromNbi: 1560, toNbi: 1610, capacity: 117 },
      { fromNbi: 1610, toNbi: 1660, capacity: 124 },
    ],
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
    formulaStartNbi: 1700,
    minimumCapacity: { oneChild: 25, twoOrMoreChildren: 50 },
    fixedCapacityBands: [
      { fromNbi: 1450, toNbi: 1500, capacity: 65 },
      { fromNbi: 1500, toNbi: 1550, capacity: 90 },
      { fromNbi: 1550, toNbi: 1600, capacity: 108 },
      { fromNbi: 1600, toNbi: 1650, capacity: 119 },
      { fromNbi: 1650, toNbi: 1700, capacity: 126 },
    ],
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
    formulaStartNbi: 1720,
    minimumCapacity: { oneChild: 25, twoOrMoreChildren: 50 },
    fixedCapacityBands: [
      { fromNbi: 1470, toNbi: 1520, capacity: 59 },
      { fromNbi: 1520, toNbi: 1570, capacity: 85 },
      { fromNbi: 1570, toNbi: 1620, capacity: 103 },
      { fromNbi: 1620, toNbi: 1670, capacity: 115 },
      { fromNbi: 1670, toNbi: 1720, capacity: 122 },
    ],
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
  if (!table) throw new Error("REVIEW_REQUIRED: historische draagkrachttabel ontbreekt voor " + year);
  return table;
}

/**
 * Calculates standard table capacity, or applies the published formula instead
 * of fixed low-income table amounts when additional costs are asserted.
 */
export function calculateHistoricalCapacity(
  year: HistoricalCapacityYear,
  nbi: number,
  childCount: number,
  options: { hasAdditionalCosts?: boolean } = {},
): number {
  if (!Number.isFinite(nbi) || nbi < 0) throw new Error("REVIEW_REQUIRED: ongeldig NBI");
  if (!Number.isInteger(childCount) || childCount < 1) {
    throw new Error("REVIEW_REQUIRED: aantal kinderen moet een positief geheel getal zijn");
  }

  const table = getHistoricalCapacityTable(year);
  if (options.hasAdditionalCosts && nbi < table.minimumNbi) {
    throw new Error("REVIEW_REQUIRED: formuleband voor extra lasten ontbreekt onder de minimum-NBI-drempel");
  }

  if (!options.hasAdditionalCosts && nbi < table.minimumNbi) {
    return childCount === 1
      ? table.minimumCapacity.oneChild
      : table.minimumCapacity.twoOrMoreChildren;
  }

  const formulaBand = [...table.bands].reverse().find((candidate) => nbi >= candidate.fromNbi);
  if (!formulaBand) throw new Error("REVIEW_REQUIRED: formuleband ontbreekt voor " + year);

  if (options.hasAdditionalCosts) {
    return Math.max(
      0,
      Math.round((formulaBand.percentage / 100) * (nbi - (0.3 * nbi + formulaBand.fixedOffset))),
    );
  }

  if (nbi < table.formulaStartNbi) {
    const fixedBand = table.fixedCapacityBands.find(
      (candidate) => nbi >= candidate.fromNbi && nbi < candidate.toNbi,
    );
    if (!fixedBand) throw new Error("REVIEW_REQUIRED: vaste draagkrachtband ontbreekt voor " + year);
    return fixedBand.capacity;
  }

  return Math.max(
    0,
    Math.round((formulaBand.percentage / 100) * (nbi - (0.3 * nbi + formulaBand.fixedOffset))),
  );
}
