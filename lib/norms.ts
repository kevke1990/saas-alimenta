export const NORM_VERSION = "2026.1";
export const NEED_TABLE: Record<number, number[]> = {
  1: [200,275,350,425,540,610,680,745,805,870,930,985],
  2: [345,475,605,735,905,1025,1145,1260,1375,1485,1590,1695],
  3: [345,495,645,795,945,1080,1215,1345,1470,1595,1720,1835],
  4: [410,590,770,950,1130,1295,1460,1620,1775,1930,2080,2230]
};
export const NBGI_POINTS = [2000,2500,3000,3500,4000,4500,5000,5500,6000,6500,7000,7500];

export const CAPACITY = {
  underAow: {
    low: [
      [1950, 25],[2000,50],[2050,77],[2100,96],[2150,109],[2200,116]
    ],
    necessary: 1365,
    housingPct: 0.30
  },
  aow: {
    low: [
      [2180, 25],[2230,51],[2280,77],[2330,97],[2380,109],[2430,116]
    ],
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

export const WSF_2026 = {
  mbo: { home: 657.49, away: 928.58, tuition: 125.92 },
  hbo: { home: 936.46, away: 1130.77, tuition: 224.50 }
};

export const INDEXATION_2026 = 0.046;
