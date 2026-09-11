export const NORM_VERSION = "2026.1";
export const NEED_TABLE: Record<number, number[]> = {
  1: [200,275,350,425,540,610,680,745,805,870,930,985],
  2: [345,475,605,735,905,1025,1145,1260,1375,1485,1590,1695],
  3: [345,495,645,795,945,1080,1215,1345,1470,1595,1720,1835],
  4: [410,590,770,950,1130,1295,1460,1620,1775,1930,2080,2230]
};
export const NBGI_POINTS = [2000,2500,3000,3500,4000,4500,5000,5500,6000,6500,7000,7500];

/** Official 2026 child-support capacity table from the Rechtspraak table.
 * Values are the recommended rounded monthly capacity for the lower-income
 * bands. From the final threshold onward the 70% formula applies.
 */
export const CAPACITY = {
  underAow: {
    low: [
      [1950, 50],
      [2000, 77],
      [2050, 96],
      [2100, 109],
      [2150, 116]
    ],
    minimumNbi: 1950,
    formulaThreshold: 2200,
    necessary: 1365,
    housingPct: 0.30
  },
  aow: {
    low: [
      [2180, 51],
      [2230, 77],
      [2280, 97],
      [2330, 109],
      [2380, 116]
    ],
    minimumNbi: 2180,
    formulaThreshold: 2430,
    necessary: 1525,
    housingPct: 0.30
  }
};

export const CARE_DISCOUNT = [
  { minDays: 0, maxDays: 0.99, pct: 0.05 },
  { minDays: 1, maxDays: 1.99, pct: 0.15 },
  { minDays: 2, maxDays: 2.99, pct: 0.25 },
  { minDays: 3, maxDays: 7, pct: 0.35 }
];

export const KGB_2026 = {
  thresholds: { single: 29736, couple: 39141 },
  phaseoutPct: 0.076,
  assetLimit: { single: 146011, couple: 184633 },
  base: { single: [5996, 8576, 11156], couple: [2580, 5160, 7740] },
  age12to15: 724,
  age16to17: 964,
  thirdChild: 2580
};

/**
 * Studiefinancieringsnormen 2026.
 * The July 2026 appendix updates the tuition/college-fee component for the
 * second half of the year. WSF_2026 is intentionally the currently effective
 * (August-December 2026) set; the first-half values remain available for
 * historical calculations and audit tooling.
 */
export const WSF_2026_H1 = {
  mbo: { home: 657.49, away: 928.58, tuition: 121.50 },
  hbo: { home: 936.46, away: 1130.77, tuition: 216.75 }
};

export const WSF_2026 = {
  mbo: { home: 657.49, away: 928.58, tuition: 125.92 },
  hbo: { home: 936.46, away: 1130.77, tuition: 224.50 }
};

/** Wettelijke indexering alimentatie per 1 januari. */
export const ALIMENTATION_INDEXATION: Record<number, number> = {
  2024: 0.062,
  2025: 0.065,
  2026: 0.046
};

export function getIndexationFactor(year: number): number {
  const rate = ALIMENTATION_INDEXATION[year];
  if (rate === undefined) throw new Error(`Geen wettelijke alimentatie-indexering bekend voor ${year}.`);
  return 1 + rate;
}

export const INDEXATION_2026 = ALIMENTATION_INDEXATION[2026];
