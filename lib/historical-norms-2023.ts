/**
 * Verified historical inputs for the 2023 Expertgroep Alimentatienormen set.
 *
 * Values below are transcribed from official Rechtspraak publications. This
 * module is intentionally data-only: it does NOT make 2023 executable until
 * the complete parameter registry (including all fiscal/social inputs used by
 * the calculation adapter) has been independently verified.
 */

export const HISTORICAL_NORM_2023_SOURCE = {
  reportJanuary: "https://www.rechtspraak.nl/SiteCollectionDocuments/tremarapport-versie-2023-januari.pdf",
  needTable: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2023",
  capacityTable: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2023",
  archive: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen",
} as const;

export const HISTORICAL_NORM_2023 = {
  year: 2023 as const,
  effectiveFrom: "2023-01-01",
  effectiveTo: "2023-12-31",
  version: "2023.1",
  needIncomePoints: [1500, 1750, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000],
  needTable: {
    1: [150, 190, 230, 310, 390, 470, 550, 630, 710, 790, 870],
    2: [235, 310, 380, 515, 650, 785, 920, 1055, 1190, 1325, 1460],
    3: [245, 315, 390, 545, 700, 855, 1010, 1165, 1320, 1475, 1630],
    4: [280, 370, 460, 645, 830, 1015, 1200, 1385, 1570, 1755, 1940],
  } as Record<number, number[]>,
  capacity: {
    underAow: {
      minimumNbi: 1680,
      formulaThreshold: 1930,
      necessary: 1175,
      housingPct: 0.30,
      low: [[1680, 51], [1730, 77], [1780, 97], [1830, 109], [1880, 116], [1930, 123]] as [number, number][],
    },
    aow: {
      minimumNbi: 1890,
      formulaThreshold: 2090,
      necessary: 1315,
      housingPct: 0.30,
      low: [[1890, 52], [1940, 74], [1990, 90], [2040, 97], [2090, 104]] as [number, number][],
    },
  },
  careDiscount: [
    { minDays: 0, maxDays: 0.99, pct: 0.05 },
    { minDays: 1, maxDays: 1.99, pct: 0.15 },
    { minDays: 2, maxDays: 2.99, pct: 0.25 },
    { minDays: 3, maxDays: 7, pct: 0.35 },
  ],
  wsfPeriods: [
    { from: "2023-01-01", to: "2023-07-31", mbo: { home: 556.95, away: 786.59, tuition: 103.25 }, hbo: { home: 957.87, away: 957.87, tuition: 184.08 } },
    { from: "2023-08-01", to: "2023-08-31", mbo: { home: 556.95, away: 786.59, tuition: 113.08 }, hbo: { home: 957.87, away: 957.87, tuition: 184.08 } },
    { from: "2023-09-01", to: "2023-12-31", mbo: { home: 556.95, away: 786.59, tuition: 113.08 }, hbo: { home: 957.87, away: 957.87, tuition: 192.83 } },
  ],
  verification: {
    needTable: "verified",
    capacity: "verified",
    careDiscount: "verified",
    wsf: "verified",
    fiscalParameters: "pending",
    socialPremiumParameters: "pending",
    minimumIncome: "pending",
    otherRequiredNormInputs: "pending",
  } as const,
} as const;

export type HistoricalNorm2023 = typeof HISTORICAL_NORM_2023;
