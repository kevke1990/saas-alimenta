export type HistoricalReferenceCase = {
  id: string;
  year: 2017 | 2018 | 2019 | 2020;
  nbi: number;
  expectedBand: string;
  purpose: "boundary" | "formula";
};

/**
 * Deterministic boundary/reference fixtures for the 2017-2020 historical
 * capacity registry. Expected outputs are intentionally represented as
 * regime/band assertions here; exact monetary outcomes belong to the
 * calculation-engine reference suite once the historical source tables are
 * wired into the engine.
 */
export const historical2017to2020ReferenceCases: HistoricalReferenceCase[] = [
  { id: "2017-min", year: 2017, nbi: 1325, expectedBand: "minimum", purpose: "boundary" },
  { id: "2017-formula", year: 2017, nbi: 1575, expectedBand: "formula", purpose: "formula" },
  { id: "2018-min", year: 2018, nbi: 1350, expectedBand: "minimum", purpose: "boundary" },
  { id: "2018-formula", year: 2018, nbi: 1600, expectedBand: "formula", purpose: "formula" },
  { id: "2019-min", year: 2019, nbi: 1375, expectedBand: "minimum", purpose: "boundary" },
  { id: "2019-formula", year: 2019, nbi: 1625, expectedBand: "formula", purpose: "formula" },
  { id: "2020-min", year: 2020, nbi: 1410, expectedBand: "minimum", purpose: "boundary" },
  { id: "2020-formula", year: 2020, nbi: 1660, expectedBand: "formula", purpose: "formula" },
];

export function assertHistoricalReferenceCases(cases: HistoricalReferenceCase[] = historical2017to2020ReferenceCases): void {
  if (cases.length !== 8) throw new Error("2017-2020 reference matrix is incomplete");
  for (const testCase of cases) {
    if (!Number.isFinite(testCase.nbi) || testCase.nbi <= 0) {
      throw new Error(`Invalid NBI in reference case ${testCase.id}`);
    }
  }
}
