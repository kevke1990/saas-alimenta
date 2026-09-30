export type HistoricalPeriod2013_2016 = {
  id: string;
  start: string;
  end: string;
  source: string;
  transition?: "pre-2013-guidelines" | "2013-guidelines" | "standard";
};

/**
 * Historical source coverage for the 2013-2016 migration batch.
 * Values are deliberately metadata-only until each period has independently
 * verified parameters, rules, provenance and reference calculations.
 */
export const HISTORICAL_2013_2016_PERIODS: HistoricalPeriod2013_2016[] = [
  { id: "2013-pre-apr", start: "2013-01-01", end: "2013-03-31", source: "https://www.rechtspraak.nl/", transition: "pre-2013-guidelines" },
  { id: "2013-apr-jun", start: "2013-04-01", end: "2013-06-30", source: "https://www.rechtspraak.nl/", transition: "2013-guidelines" },
  { id: "2013-h2", start: "2013-07-01", end: "2013-12-31", source: "https://www.rechtspraak.nl/", transition: "2013-guidelines" },
  ...([2014, 2015, 2016] as const).flatMap((year) => [
    { id: `${year}-h1`, start: `${year}-01-01`, end: `${year}-06-30`, source: "https://www.rechtspraak.nl/", transition: "standard" as const },
    { id: `${year}-h2`, start: `${year}-07-01`, end: `${year}-12-31`, source: "https://www.rechtspraak.nl/", transition: "standard" as const },
  ]),
];

export function resolveHistorical2013_2016(date: string): HistoricalPeriod2013_2016 {
  const match = HISTORICAL_2013_2016_PERIODS.find((period) => date >= period.start && date <= period.end);
  if (!match) throw new Error("REVIEW_REQUIRED: historical 2013-2016 period is not covered");
  return match;
}
