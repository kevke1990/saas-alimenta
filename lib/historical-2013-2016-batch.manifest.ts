export const HISTORICAL_2013_2016_BATCH_MANIFEST = {
  batch: "2013-2016",
  status: "source-covered-not-release-ready",
  required: [
    "parameters",
    "historical-rules",
    "provenance",
    "reference-calculations",
    "engine-adapter",
    "regression-tests",
  ],
  periods: 9,
  transitionBoundary: "2013-04-01",
  failClosed: true,
} as const;
