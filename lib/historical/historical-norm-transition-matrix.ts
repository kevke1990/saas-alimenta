/**
 * Historical transition matrix for periods where the Expertgroep published
 * more than one norm update within a calendar year.
 *
 * This is deliberately separate from the source catalog: a calendar year is
 * not necessarily a single calculation regime. A calculation must select the
 * regime by effective date before loading parameters.
 */

export type HistoricalNormTransition = {
  year: number;
  effectiveFrom: string;
  effectiveTo: string;
  sourceRevision: "january" | "april" | "july";
  notes: string;
};

export const HISTORICAL_NORM_TRANSITIONS: readonly HistoricalNormTransition[] = [
  // 2013 is exceptional: the revised child-maintenance method took effect on
  // 1 April 2013, with a further July publication/update.
  {
    year: 2013,
    effectiveFrom: "2013-01-01",
    effectiveTo: "2013-03-31",
    sourceRevision: "january",
    notes: "Pre-1-April-2013 regime; do not apply the revised 2013 calculation method.",
  },
  {
    year: 2013,
    effectiveFrom: "2013-04-01",
    effectiveTo: "2013-06-30",
    sourceRevision: "april",
    notes: "Revised child-maintenance calculation method effective from 1 April 2013.",
  },
  {
    year: 2013,
    effectiveFrom: "2013-07-01",
    effectiveTo: "2013-12-31",
    sourceRevision: "july",
    notes: "Second-half 2013 publication/regime; parameters must come from the July source set.",
  },
  {
    year: 2014,
    effectiveFrom: "2014-01-01",
    effectiveTo: "2014-06-30",
    sourceRevision: "january",
    notes: "First-half 2014 regime.",
  },
  {
    year: 2014,
    effectiveFrom: "2014-07-01",
    effectiveTo: "2014-12-31",
    sourceRevision: "july",
    notes: "Second-half 2014 regime.",
  },
  {
    year: 2015,
    effectiveFrom: "2015-01-01",
    effectiveTo: "2015-06-30",
    sourceRevision: "january",
    notes: "First-half 2015 regime; includes the 2015 child-regulation changes.",
  },
  {
    year: 2015,
    effectiveFrom: "2015-07-01",
    effectiveTo: "2015-12-31",
    sourceRevision: "july",
    notes: "Second-half 2015 regime; use the July/addendum source set where applicable.",
  },
  {
    year: 2016,
    effectiveFrom: "2016-01-01",
    effectiveTo: "2016-06-30",
    sourceRevision: "january",
    notes: "First-half 2016 regime.",
  },
  {
    year: 2016,
    effectiveFrom: "2016-07-01",
    effectiveTo: "2016-12-31",
    sourceRevision: "july",
    notes: "Second-half 2016 regime; parameters must be sourced from the second-half publication when applicable.",
  },
];

export function getHistoricalNormTransition(date: string): HistoricalNormTransition | undefined {
  return HISTORICAL_NORM_TRANSITIONS.find(
    (period) => date >= period.effectiveFrom && date <= period.effectiveTo,
  );
}

export function assertHistoricalTransitionCoverage(date: string): void {
  if (date >= "2013-01-01" && date <= "2016-12-31" && !getHistoricalNormTransition(date)) {
    throw new Error(`No historical norm transition covers calculation date ${date}`);
  }
}
