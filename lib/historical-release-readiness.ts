/**
 * Final historical release-readiness gate.
 *
 * This deliberately does not mark unverified history executable. It provides
 * one deterministic contract for the final batch: every historical period
 * must have verified parameters, period rules, provenance and reference cases.
 */

export type HistoricalPeriodStatus = {
  period: string;
  parametersVerified: boolean;
  rulesVerified: boolean;
  provenanceVerified: boolean;
  referenceCasesVerified: boolean;
};

export function isHistoricalPeriodReleaseReady(status: HistoricalPeriodStatus): boolean {
  return (
    status.parametersVerified &&
    status.rulesVerified &&
    status.provenanceVerified &&
    status.referenceCasesVerified
  );
}

export function assertHistoricalReleaseReady(statuses: HistoricalPeriodStatus[]): void {
  const incomplete = statuses.filter((status) => !isHistoricalPeriodReleaseReady(status));
  if (incomplete.length === 0) return;

  throw new Error(
    `Historical release blocked: ${incomplete.map((status) => status.period).join(", ")}`,
  );
}

/**
 * Required coverage for the historical engine. Keep this list explicit so a
 * future contributor cannot accidentally ship a release with a missing era.
 */
export const REQUIRED_HISTORICAL_COVERAGE = [
  "2006-01-01/2006-06-30",
  "2006-07-01/2006-12-31",
  "2007-01-01/2007-06-30",
  "2007-07-01/2007-12-31",
  "2008-01-01/2008-06-30",
  "2008-07-01/2008-12-31",
  "2009-01-01/2009-06-30",
  "2009-07-01/2009-12-31",
  "2010-01-01/2010-06-30",
  "2010-07-01/2010-12-31",
  "2011-01-01/2011-06-30",
  "2011-07-01/2011-12-31",
  "2012-01-01/2012-06-30",
  "2012-07-01/2012-12-31",
  "2013-01-01/2013-03-31",
  "2013-04-01/2013-06-30",
  "2013-07-01/2013-12-31",
  "2014-01-01/2014-06-30",
  "2014-07-01/2014-12-31",
  "2015-01-01/2015-06-30",
  "2015-07-01/2015-12-31",
  "2016-01-01/2016-06-30",
  "2016-07-01/2016-12-31",
  "2017-01-01/2017-06-30",
  "2017-07-01/2017-12-31",
  "2018-01-01/2018-06-30",
  "2018-07-01/2018-12-31",
  "2019-01-01/2019-06-30",
  "2019-07-01/2019-12-31",
  "2020-01-01/2020-06-30",
  "2020-07-01/2020-12-31",
  "2021-01-01/2021-06-30",
  "2021-07-01/2021-12-31",
  "2022-01-01/2022-06-30",
  "2022-07-01/2022-12-31",
  "2023-01-01/2023-06-30",
  "2023-07-01/2023-12-31",
] as const;
