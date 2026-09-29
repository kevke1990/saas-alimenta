/**
 * Executable source manifest for the 2017-2022 historical batch.
 *
 * This deliberately separates source coverage from verified numeric parameters:
 * a period may only become executable after parameters, historical rules,
 * provenance and reference calculations have all been independently verified.
 */
export type HistoricalPeriod = {
  id: string;
  start: string;
  end: string;
  reportTitle: string;
  sourcePage: string;
  requiredArtifacts: readonly ["report", "need-table", "capacity-table", "first-half", "second-half"];
};

const SOURCE_PAGE =
  "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen";

export const HISTORICAL_2017_2022_PERIODS: readonly HistoricalPeriod[] = [
  { id: "2017-H1", start: "2017-01-01", end: "2017-06-30", reportTitle: "Rapport Alimentatienormen 2017", sourcePage: SOURCE_PAGE, requiredArtifacts: ["report", "need-table", "capacity-table", "first-half", "second-half"] },
  { id: "2017-H2", start: "2017-07-01", end: "2017-12-31", reportTitle: "Rapport Alimentatienormen 2017", sourcePage: SOURCE_PAGE, requiredArtifacts: ["report", "need-table", "capacity-table", "first-half", "second-half"] },
  { id: "2018-H1", start: "2018-01-01", end: "2018-06-30", reportTitle: "Rapport Alimentatienormen 2018", sourcePage: SOURCE_PAGE, requiredArtifacts: ["report", "need-table", "capacity-table", "first-half", "second-half"] },
  { id: "2018-H2", start: "2018-07-01", end: "2018-12-31", reportTitle: "Rapport Alimentatienormen 2018", sourcePage: SOURCE_PAGE, requiredArtifacts: ["report", "need-table", "capacity-table", "first-half", "second-half"] },
  { id: "2019-H1", start: "2019-01-01", end: "2019-06-30", reportTitle: "Rapport Alimentatienormen 2019", sourcePage: SOURCE_PAGE, requiredArtifacts: ["report", "need-table", "capacity-table", "first-half", "second-half"] },
  { id: "2019-H2", start: "2019-07-01", end: "2019-12-31", reportTitle: "Rapport Alimentatienormen 2019", sourcePage: SOURCE_PAGE, requiredArtifacts: ["report", "need-table", "capacity-table", "first-half", "second-half"] },
  { id: "2020-H1", start: "2020-01-01", end: "2020-06-30", reportTitle: "Rapport Alimentatienormen 2020", sourcePage: SOURCE_PAGE, requiredArtifacts: ["report", "need-table", "capacity-table", "first-half", "second-half"] },
  { id: "2020-H2", start: "2020-07-01", end: "2020-12-31", reportTitle: "Rapport Alimentatienormen 2020", sourcePage: SOURCE_PAGE, requiredArtifacts: ["report", "need-table", "capacity-table", "first-half", "second-half"] },
  { id: "2021-H1", start: "2021-01-01", end: "2021-06-30", reportTitle: "Rapport Alimentatienormen 2021", sourcePage: SOURCE_PAGE, requiredArtifacts: ["report", "need-table", "capacity-table", "first-half", "second-half"] },
  { id: "2021-H2", start: "2021-07-01", end: "2021-12-31", reportTitle: "Rapport Alimentatienormen 2021", sourcePage: SOURCE_PAGE, requiredArtifacts: ["report", "need-table", "capacity-table", "first-half", "second-half"] },
  { id: "2022-H1", start: "2022-01-01", end: "2022-06-30", reportTitle: "Rapport Alimentatienormen 2022", sourcePage: SOURCE_PAGE, requiredArtifacts: ["report", "need-table", "capacity-table", "first-half", "second-half"] },
  { id: "2022-H2", start: "2022-07-01", end: "2022-12-31", reportTitle: "Rapport Alimentatienormen 2022", sourcePage: SOURCE_PAGE, requiredArtifacts: ["report", "need-table", "capacity-table", "first-half", "second-half"] },
];

export const HISTORICAL_2017_2022_REQUIRED_FIELDS = [
  "parameters",
  "historical-rules",
  "provenance",
  "reference-calculations",
  "engine-adapter",
  "boundary-regression",
] as const;

export function periodForCalculationDate(calculationDate: string): HistoricalPeriod | undefined {
  return HISTORICAL_2017_2022_PERIODS.find(
    ({ start, end }) => calculationDate >= start && calculationDate <= end,
  );
}
