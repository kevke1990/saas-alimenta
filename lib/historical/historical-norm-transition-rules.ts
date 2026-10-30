/**
 * Explicit historical transition rules for the 2013-2016 alimentatienormen.
 *
 * These rules select a calculation regime by effective date. They do not
 * provide parameter values; missing parameters must remain fail-closed.
 */
export type HistoricalTransitionRule = {
  id: string;
  effectiveFrom: string;
  effectiveTo: string;
  method: "legacy" | "2013-reformed" | "half-year";
  sourceYear: number;
  sourceLocator: string;
  notes: string;
};

export const HISTORICAL_TRANSITION_RULES: readonly HistoricalTransitionRule[] = [
  {
    id: "2013-pre-april",
    effectiveFrom: "2013-01-01",
    effectiveTo: "2013-03-31",
    method: "legacy",
    sourceYear: 2013,
    sourceLocator: "Rapport Alimentatienormen 2013, overgangsregeling, p. 3",
    notes: "Need uses the new KGB treatment; child-support capacity remains under the prior calculation method.",
  },
  {
    id: "2013-april-reform",
    effectiveFrom: "2013-04-01",
    effectiveTo: "2013-06-30",
    method: "2013-reformed",
    sourceYear: 2013,
    sourceLocator: "Rapport Alimentatienormen 2013, wijzigingen per 1 april 2013, p. 3",
    notes: "New child-support capacity table, care-cost allocation and acceptability test apply.",
  },
  {
    id: "2013-july",
    effectiveFrom: "2013-07-01",
    effectiveTo: "2013-12-31",
    method: "half-year",
    sourceYear: 2013,
    sourceLocator: "Rapport Alimentatienormen 2013, versie juli 2013",
    notes: "Second-half 2013 parameters must be sourced from the July appendix/table set.",
  },
  {
    id: "2014-h1",
    effectiveFrom: "2014-01-01",
    effectiveTo: "2014-06-30",
    method: "half-year",
    sourceYear: 2014,
    sourceLocator: "Rapport Alimentatienormen 2014, versie januari 2014 / bijlage eerste helft",
    notes: "First-half 2014 parameter set.",
  },
  {
    id: "2014-h2",
    effectiveFrom: "2014-07-01",
    effectiveTo: "2014-12-31",
    method: "half-year",
    sourceYear: 2014,
    sourceLocator: "Rapport Alimentatienormen 2014, versie juli 2014 / bijlage tweede helft",
    notes: "Second-half 2014 parameter set.",
  },
  {
    id: "2015-h1",
    effectiveFrom: "2015-01-01",
    effectiveTo: "2015-06-30",
    method: "half-year",
    sourceYear: 2015,
    sourceLocator: "Rapport Alimentatienormen 2015 / bijlage eerste helft",
    notes: "2015 incorporates the reform of child-related schemes and abolition of the fiscal child-support benefit.",
  },
  {
    id: "2015-h2",
    effectiveFrom: "2015-07-01",
    effectiveTo: "2015-12-31",
    method: "half-year",
    sourceYear: 2015,
    sourceLocator: "Addendum Rapport Alimentatienormen januari 2015, geldend vanaf 1 juli 2015 / bijlage tweede helft",
    notes: "Second-half 2015 changes must not fall back to the first-half set.",
  },
  {
    id: "2016-h1",
    effectiveFrom: "2016-01-01",
    effectiveTo: "2016-06-30",
    method: "half-year",
    sourceYear: 2016,
    sourceLocator: "Rapport Alimentatienormen 2016 januari / bijlage eerste helft",
    notes: "First-half 2016 parameter set.",
  },
  {
    id: "2016-h2",
    effectiveFrom: "2016-07-01",
    effectiveTo: "2016-12-31",
    method: "half-year",
    sourceYear: 2016,
    sourceLocator: "Bijlage Rapport Alimentatienormen 2016 tweede helft",
    notes: "Second-half 2016 parameter set.",
  },
] as const;

export function getHistoricalTransitionRule(date: string): HistoricalTransitionRule | undefined {
  return HISTORICAL_TRANSITION_RULES.find(
    (rule) => date >= rule.effectiveFrom && date <= rule.effectiveTo,
  );
}
