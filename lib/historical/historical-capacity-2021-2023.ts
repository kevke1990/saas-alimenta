/**
 * Official historical child-support capacity table inputs for 2021-2023.
 *
 * Source: Rechtspraak Expertgroep Alimentatienormen capacity tables.
 * This module intentionally contains only independently sourced capacity
 * parameters. It does not make the complete historical engine executable;
 * fiscal/social/minimum-income inputs and reference calculations remain
 * separate release gates.
 */

export type CapacityBand = {
  fromNbi: number;
  toNbiExclusive?: number;
  percentage: number;
  necessaryCosts: number;
  minimumCapacity: number;
};

export type HistoricalCapacitySet = {
  year: 2021 | 2022 | 2023;
  source: string;
  underAow: {
    minimumNbi: number;
    formulaThreshold: number;
    bands: CapacityBand[];
  };
  aow: {
    minimumNbi: number;
    formulaThreshold: number;
    bands: CapacityBand[];
  };
};

export const HISTORICAL_CAPACITY_2021_2023: HistoricalCapacitySet[] = [
  {
    year: 2021,
    source:
      "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2021",
    underAow: {
      minimumNbi: 1450,
      formulaThreshold: 1700,
      bands: [
        { fromNbi: 1450, toNbiExclusive: 1500, percentage: 100, necessaryCosts: 950, minimumCapacity: 65 },
        { fromNbi: 1500, toNbiExclusive: 1550, percentage: 90, necessaryCosts: 950, minimumCapacity: 90 },
        { fromNbi: 1550, toNbiExclusive: 1600, percentage: 80, necessaryCosts: 950, minimumCapacity: 108 },
        { fromNbi: 1600, toNbiExclusive: 1650, percentage: 70, necessaryCosts: 950, minimumCapacity: 119 },
        { fromNbi: 1650, toNbiExclusive: 1700, percentage: 70, necessaryCosts: 975, minimumCapacity: 126 },
        { fromNbi: 1700, percentage: 70, necessaryCosts: 1000, minimumCapacity: 133 },
      ],
    },
    aow: {
      minimumNbi: 1625,
      formulaThreshold: 1825,
      bands: [
        { fromNbi: 1625, toNbiExclusive: 1675, percentage: 90, necessaryCosts: 1070, minimumCapacity: 61 },
        { fromNbi: 1675, toNbiExclusive: 1725, percentage: 80, necessaryCosts: 1070, minimumCapacity: 82 },
        { fromNbi: 1725, toNbiExclusive: 1775, percentage: 70, necessaryCosts: 1070, minimumCapacity: 96 },
        { fromNbi: 1775, toNbiExclusive: 1825, percentage: 70, necessaryCosts: 1095, minimumCapacity: 103 },
        { fromNbi: 1825, percentage: 70, necessaryCosts: 1120, minimumCapacity: 110 },
      ],
    },
  },
  {
    year: 2022,
    source:
      "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2022",
    underAow: {
      minimumNbi: 1470,
      formulaThreshold: 1720,
      bands: [
        { fromNbi: 1470, toNbiExclusive: 1520, percentage: 100, necessaryCosts: 970, minimumCapacity: 59 },
        { fromNbi: 1520, toNbiExclusive: 1570, percentage: 90, necessaryCosts: 970, minimumCapacity: 85 },
        { fromNbi: 1570, toNbiExclusive: 1620, percentage: 80, necessaryCosts: 970, minimumCapacity: 103 },
        { fromNbi: 1620, toNbiExclusive: 1670, percentage: 70, necessaryCosts: 970, minimumCapacity: 115 },
        { fromNbi: 1670, toNbiExclusive: 1720, percentage: 70, necessaryCosts: 995, minimumCapacity: 122 },
        { fromNbi: 1720, percentage: 70, necessaryCosts: 1020, minimumCapacity: 129 },
      ],
    },
    aow: {
      minimumNbi: 1645,
      formulaThreshold: 1845,
      bands: [
        { fromNbi: 1645, toNbiExclusive: 1695, percentage: 90, necessaryCosts: 1090, minimumCapacity: 55 },
        { fromNbi: 1695, toNbiExclusive: 1745, percentage: 80, necessaryCosts: 1090, minimumCapacity: 77 },
        { fromNbi: 1745, toNbiExclusive: 1795, percentage: 70, necessaryCosts: 1090, minimumCapacity: 92 },
        { fromNbi: 1795, toNbiExclusive: 1845, percentage: 70, necessaryCosts: 1115, minimumCapacity: 99 },
        { fromNbi: 1845, percentage: 70, necessaryCosts: 1140, minimumCapacity: 106 },
      ],
    },
  },
  {
    year: 2023,
    source:
      "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2023",
    underAow: {
      minimumNbi: 1680,
      formulaThreshold: 1930,
      bands: [
        { fromNbi: 1680, toNbiExclusive: 1730, percentage: 100, necessaryCosts: 1125, minimumCapacity: 51 },
        { fromNbi: 1730, toNbiExclusive: 1780, percentage: 90, necessaryCosts: 1125, minimumCapacity: 77 },
        { fromNbi: 1780, toNbiExclusive: 1830, percentage: 80, necessaryCosts: 1125, minimumCapacity: 97 },
        { fromNbi: 1830, toNbiExclusive: 1880, percentage: 70, necessaryCosts: 1125, minimumCapacity: 109 },
        { fromNbi: 1880, toNbiExclusive: 1930, percentage: 70, necessaryCosts: 1150, minimumCapacity: 116 },
        { fromNbi: 1930, percentage: 70, necessaryCosts: 1175, minimumCapacity: 123 },
      ],
    },
    aow: {
      minimumNbi: 1890,
      formulaThreshold: 2090,
      bands: [
        { fromNbi: 1890, toNbiExclusive: 1940, percentage: 90, necessaryCosts: 1265, minimumCapacity: 52 },
        { fromNbi: 1940, toNbiExclusive: 1990, percentage: 80, necessaryCosts: 1265, minimumCapacity: 74 },
        { fromNbi: 1990, toNbiExclusive: 2040, percentage: 70, necessaryCosts: 1265, minimumCapacity: 90 },
        { fromNbi: 2040, toNbiExclusive: 2090, percentage: 70, necessaryCosts: 1290, minimumCapacity: 97 },
        { fromNbi: 2090, percentage: 70, necessaryCosts: 1315, minimumCapacity: 104 },
      ],
    },
  },
];

export function getHistoricalCapacity(year: 2021 | 2022 | 2023): HistoricalCapacitySet {
  const result = HISTORICAL_CAPACITY_2021_2023.find((entry) => entry.year === year);
  if (!result) throw new Error(`Historical capacity not available for ${year}`);
  return result;
}
