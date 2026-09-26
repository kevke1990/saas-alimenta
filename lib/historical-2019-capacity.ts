/**
 * Official 2019 child-support capacity table.
 * Source: Rechtspraak archive / Rapport Alimentatienormen januari 2019.
 * This module intentionally does not supply values for other years.
 */
export type Historical2019Band = {
  minNbi: number;
  maxNbiExclusive?: number;
  capacityMonthly: number | "25/50";
  aow: boolean;
};

export const HISTORICAL_2019_SOURCE =
  "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/archief";

export const HISTORICAL_2019_BANDS: readonly Historical2019Band[] = [
  { minNbi: 0, maxNbiExclusive: 1375, capacityMonthly: "25/50", aow: false },
  { minNbi: 1375, maxNbiExclusive: 1425, capacityMonthly: 63, aow: false },
  { minNbi: 1425, maxNbiExclusive: 1475, capacityMonthly: 88, aow: false },
  { minNbi: 1475, maxNbiExclusive: 1525, capacityMonthly: 106, aow: false },
  { minNbi: 1525, maxNbiExclusive: 1575, capacityMonthly: 117, aow: false },
  { minNbi: 1575, maxNbiExclusive: 1625, capacityMonthly: 124, aow: false },
  { minNbi: 1625, capacityMonthly: 131, aow: false },
  { minNbi: 0, maxNbiExclusive: 1560, capacityMonthly: "25/50", aow: true },
  { minNbi: 1560, maxNbiExclusive: 1610, capacityMonthly: 65, aow: true },
  { minNbi: 1610, maxNbiExclusive: 1660, capacityMonthly: 86, aow: true },
  { minNbi: 1660, maxNbiExclusive: 1710, capacityMonthly: 99, aow: true },
  { minNbi: 1710, maxNbiExclusive: 1760, capacityMonthly: 106, aow: true },
  { minNbi: 1760, capacityMonthly: 113, aow: true },
];

export const HISTORICAL_2019_FORMULA = {
  nonAow: { threshold: 1625, necessary: 950 },
  aow: { threshold: 1760, necessary: 1070 },
} as const;

export function findHistorical2019Band(
  nbi: number,
  aow = false,
): Historical2019Band | undefined {
  return HISTORICAL_2019_BANDS.find(
    (band) =>
      band.aow === aow &&
      nbi >= band.minNbi &&
      (band.maxNbiExclusive === undefined || nbi < band.maxNbiExclusive),
  );
}

export function calculateHistorical2019Capacity(
  nbi: number,
  aow = false,
): number | undefined {
  const band = findHistorical2019Band(nbi, aow);
  if (!band || band.capacityMonthly === "25/50") return undefined;
  const rule = aow
    ? HISTORICAL_2019_FORMULA.aow
    : HISTORICAL_2019_FORMULA.nonAow;
  if (nbi < rule.threshold) return band.capacityMonthly;
  return Math.max(
    0,
    Math.round(0.7 * (nbi - (0.3 * nbi + rule.necessary))),
  );
}
