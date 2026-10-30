/**
 * Large-batch historical completion matrix for 2017-2022.
 *
 * This file deliberately separates source coverage from executable readiness.
 * A period is NOT executable until parameters, rules, provenance and
 * reference calculations are independently verified.
 */
export type HistoricalBatchPeriod = {
  periodId: string;
  effectiveFrom: string;
  sourceCoverage: "complete";
  parametersVerified: false;
  rulesVerified: false;
  provenanceVerified: true;
  referenceCasesVerified: false;
  nextAction: "extract-and-validate-parameters";
};

const R = "https://www.rechtspraak.nl";

const periods = [
  ["2017-H1", "2017-01-01", "SiteCollectionDocuments/tremarapport-versie-2017-januari.pdf", "SiteCollectionDocuments/behoeftetabel-alimentatie-2017.pdf", "SiteCollectionDocuments/bijlage-2017-eerste-helft.pdf"],
  ["2017-H2", "2017-07-01", "SiteCollectionDocuments/tremarapport-versie-2017-januari.pdf", "SiteCollectionDocuments/behoeftetabel-alimentatie-2017.pdf", "SiteCollectionDocuments/bijlage-2017-tweede-helft.pdf"],
  ["2018-H1", "2018-01-01", "SiteCollectionDocuments/tremarapport-versie-2018-januari.pdf", "SiteCollectionDocuments/behoeftetabel-alimentatie-2018.pdf", "SiteCollectionDocuments/bijlage-2018-eerste-helft.pdf"],
  ["2018-H2", "2018-07-01", "SiteCollectionDocuments/tremarapport-versie-2018-januari.pdf", "SiteCollectionDocuments/behoeftetabel-alimentatie-2018.pdf", "SiteCollectionDocuments/bijlage-2018-tweede-helft.pdf"],
  ["2019-H1", "2019-01-01", "SiteCollectionDocuments/tremarapport-versie-2019-januari.pdf", "binaries/content/assets/rvdr/wa/2019/rvdr-wa-2019-behoeftetabel-alimentatie.pdf", "binaries/content/assets/rvdr/wa/2019/rvdr-wa-2019-bijlage-2019-eerste-helft-rapport-alimentatienormen.pdf"],
  ["2019-H2", "2019-07-01", "SiteCollectionDocuments/tremarapport-versie-2019-januari.pdf", "binaries/content/assets/rvdr/wa/2019/rvdr-wa-2019-behoeftetabel-alimentatie.pdf", "binaries/content/assets/rvdr/wa/2019/rvdr-wa-2019-bijlage-2019-tweede-helft-rapport-alimentatienormen.pdf"],
  ["2020-H1", "2020-01-01", "SiteCollectionDocuments/tremarapport-versie-2020-januari.pdf", "voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2020", "binaries/content/assets/rvdr/wa/2020/rvdr-wa-2020-bijlage-2020-eerste-helft-rapport-alimentatienormen.pdf"],
  ["2020-H2", "2020-07-01", "SiteCollectionDocuments/tremarapport-versie-2020-januari.pdf", "voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2020", "binaries/content/assets/rvdr/wa/2020/rvdr-wa-2020-bijlage-2020-tweede-helft-rapport-alimentatienormen.pdf"],
  ["2021-H1", "2021-01-01", "SiteCollectionDocuments/tremarapport-versie-2021-januari.pdf", "voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2021", "binaries/content/assets/rvdr/wa/2021/rvdr-wa-2021-bijlage-2021-eerste-helft-rapport-alimentatienormen.pdf"],
  ["2021-H2", "2021-07-01", "SiteCollectionDocuments/tremarapport-versie-2021-januari.pdf", "voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2021", "binaries/content/assets/rvdr/wa/2021/rvdr-wa-2021-bijlage-2021-tweede-helft-rapport-alimentatienormen.pdf"],
  ["2022-H1", "2022-01-01", "sitecollectiondocuments/tremarapport-versie-2022-januari.pdf", "voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2022", "binaries/content/assets/rvdr/wa/2022/rvdr-wa-2022-bijlage-2022-eerste-helft-rapport-alimentatienormen.pdf"],
  ["2022-H2", "2022-07-01", "sitecollectiondocuments/tremarapport-versie-2022-januari.pdf", "voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2022", "SiteCollectionDocuments/bijlage-2022-tweede-helft.pdf"],
] as const;

export const HISTORICAL_BATCH_2017_2022: readonly HistoricalBatchPeriod[] = periods.map(
  ([periodId, effectiveFrom]) => ({
    periodId,
    effectiveFrom,
    sourceCoverage: "complete",
    parametersVerified: false,
    rulesVerified: false,
    provenanceVerified: true,
    referenceCasesVerified: false,
    nextAction: "extract-and-validate-parameters",
  }),
);

export const HISTORICAL_BATCH_2017_2022_SOURCE_URLS = Object.fromEntries(
  periods.map(([periodId, , report, need, appendix]) => [periodId, {
    reportUrl: `${R}/${report}`,
    needTableUrl: `${R}/${need}`,
    capacityTableUrl: `${R}/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-${periodId.slice(0, 4)}`,
    appendixUrl: `${R}/${appendix}`,
  }]),
) as Record<string, { reportUrl: string; needTableUrl: string; capacityTableUrl: string; appendixUrl: string }>;

export function isHistoricalBatch2017To2022ReleaseReady(): boolean {
  return HISTORICAL_BATCH_2017_2022.every(
    (p) => p.parametersVerified && p.rulesVerified && p.provenanceVerified && p.referenceCasesVerified,
  );
}
