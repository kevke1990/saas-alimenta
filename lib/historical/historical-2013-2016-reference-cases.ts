export const HISTORICAL_2013_2016_REFERENCE_CASES = [
  { id: "2013-transition", date: "2013-04-01", expectedRegime: "2013-guidelines" },
  { id: "2014-kgb", date: "2014-07-01", expectedKgbTreatment: "child-need" },
  { id: "2015-whk", date: "2015-01-01", expectedKgbTreatment: "child-need-including-single-parent-head" },
  { id: "2016-end", date: "2016-12-31", expectedRegime: "whk" },
] as const;
