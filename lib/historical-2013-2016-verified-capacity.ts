/**
 * Verified historical capacity-formula parameters for the 2013-2016 regime.
 *
 * Scope: the post-1-April-2013 child-support method and the annual tables
 * published by Rechtspraak for 2014-2016.  The pre-1-April-2013 regime is
 * intentionally not represented numerically here: it used the legacy method
 * and must be sourced separately rather than silently reusing the new method.
 */

export type HistoricalCapacityBand = {
  fromNbi: number;
  percentage: 70 | 80 | 90 | 100;
  dklFixed: number;
};

export type HistoricalCapacityParameters = {
  year: 2013 | 2014 | 2015 | 2016;
  effectiveFrom: string;
  source: string;
  minimumNbi: number;
  formulaStartNbi: number;
  bands: HistoricalCapacityBand[];
};

export const HISTORICAL_CAPACITY_2013_2016: HistoricalCapacityParameters[] = [
  {
    year: 2013,
    effectiveFrom: "2013-04-01",
    source: "Rechtspraak, Draagkrachttabel 2013 / Draagkrachttabel 2013-2",
    minimumNbi: 1250,
    formulaStartNbi: 1500,
    bands: [
      { fromNbi: 1250, percentage: 100, dklFixed: 800 },
      { fromNbi: 1300, percentage: 90, dklFixed: 800 },
      { fromNbi: 1350, percentage: 80, dklFixed: 800 },
      { fromNbi: 1400, percentage: 70, dklFixed: 800 },
      { fromNbi: 1450, percentage: 70, dklFixed: 825 },
      { fromNbi: 1500, percentage: 70, dklFixed: 850 },
    ],
  },
  {
    year: 2014,
    effectiveFrom: "2014-01-01",
    source: "Rechtspraak, Draagkrachttabel 2014",
    minimumNbi: 1250,
    formulaStartNbi: 1500,
    bands: [
      { fromNbi: 1250, percentage: 100, dklFixed: 810 },
      { fromNbi: 1300, percentage: 90, dklFixed: 810 },
      { fromNbi: 1350, percentage: 80, dklFixed: 810 },
      { fromNbi: 1400, percentage: 70, dklFixed: 810 },
      { fromNbi: 1450, percentage: 70, dklFixed: 835 },
      { fromNbi: 1500, percentage: 70, dklFixed: 860 },
    ],
  },
  {
    year: 2015,
    effectiveFrom: "2015-01-01",
    source: "Rechtspraak, Draagkrachttabel 2015",
    minimumNbi: 1275,
    formulaStartNbi: 1525,
    bands: [
      { fromNbi: 1275, percentage: 100, dklFixed: 825 },
      { fromNbi: 1325, percentage: 90, dklFixed: 825 },
      { fromNbi: 1375, percentage: 80, dklFixed: 825 },
      { fromNbi: 1425, percentage: 70, dklFixed: 825 },
      { fromNbi: 1475, percentage: 70, dklFixed: 850 },
      { fromNbi: 1525, percentage: 70, dklFixed: 875 },
    ],
  },
  {
    year: 2016,
    effectiveFrom: "2016-01-01",
    source: "Rechtspraak, Draagkrachttabel 2016",
    minimumNbi: 1300,
    formulaStartNbi: 1550,
    bands: [
      { fromNbi: 1300, percentage: 100, dklFixed: 840 },
      { fromNbi: 1350, percentage: 90, dklFixed: 840 },
      { fromNbi: 1400, percentage: 80, dklFixed: 840 },
      { fromNbi: 1450, percentage: 70, dklFixed: 840 },
      { fromNbi: 1500, percentage: 70, dklFixed: 865 },
      { fromNbi: 1550, percentage: 70, dklFixed: 890 },
    ],
  },
];

export function getHistoricalCapacityParameters(date: string): HistoricalCapacityParameters | null {
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) return null;

  const eligible = HISTORICAL_CAPACITY_2013_2016
    .filter((period) => timestamp >= Date.parse(`${period.effectiveFrom}T00:00:00Z`))
    .sort((a, b) => Date.parse(`${b.effectiveFrom}T00:00:00Z`) - Date.parse(`${a.effectiveFrom}T00:00:00Z`));

  return eligible[0] ?? null;
}

export function calculateHistoricalCapacity(nbi: number, parameters: HistoricalCapacityParameters): number | null {
  if (!Number.isFinite(nbi) || nbi < 0) return null;
  if (nbi < parameters.minimumNbi) return null;

  const band = [...parameters.bands]
    .reverse()
    .find((candidate) => nbi >= candidate.fromNbi);
  if (!band) return null;

  const raw = band.percentage / 100 * (nbi - (0.3 * nbi + band.dklFixed));
  return Math.round(raw);
}
