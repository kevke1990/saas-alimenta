/**
 * Large-batch execution plan for completing the historical calculation engine.
 * This is planning metadata only: a period cannot become executable until
 * parameters, rules, provenance and reference calculations are verified.
 */
export type HistoricalBatch = {
  id: string;
  periods: readonly string[];
  scope: readonly string[];
  status: "ready" | "queued";
};

export const HISTORICAL_BATCHES: readonly HistoricalBatch[] = [
  {
    id: "2017-2022-executable",
    periods: [
      "2017-H1", "2017-H2", "2018-H1", "2018-H2",
      "2019-H1", "2019-H2", "2020-H1", "2020-H2",
      "2021-H1", "2021-H2", "2022-H1", "2022-H2",
    ],
    scope: [
      "parameters", "historical-rules", "provenance", "reference-calculations",
      "engine-adapter", "boundary-regression", "release-gate",
    ],
    status: "ready",
  },
  {
    id: "2013-2016-executable",
    periods: [
      "2013-01-01/2013-03-31", "2013-04-01/2013-06-30", "2013-07-01/2013-12-31",
      "2014-H1", "2014-H2", "2015-H1", "2015-H2", "2016-H1", "2016-H2",
    ],
    scope: [
      "transition-rules", "parameters", "provenance", "reference-calculations",
      "engine-adapter", "boundary-regression", "release-gate",
    ],
    status: "queued",
  },
  {
    id: "2006-2012-executable",
    periods: [
      "2006", "2007", "2008", "2009", "2010",
      "2011-H1", "2011-H2", "2012-H1", "2012-H2",
    ],
    scope: [
      "parameters", "historical-rules", "provenance", "reference-calculations",
      "engine-adapter", "boundary-regression", "release-gate",
    ],
    status: "queued",
  },
];

export const HISTORICAL_BATCH_COMPLETION_CONTRACT = [
  "parameters",
  "historical-rules",
  "provenance",
  "reference-calculations",
  "engine-adapter",
  "boundary-regression",
  "release-gate",
] as const;
