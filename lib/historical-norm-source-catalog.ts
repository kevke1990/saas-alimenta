/**
 * Official source catalog for historical Expertgroep Alimentatienormen.
 *
 * This is provenance metadata only. A period must not become executable until
 * every parameter used by the calculation adapter has been extracted and
 * independently verified against the cited source documents.
 */

export type NormSourcePeriod = {
  year: number;
  effectiveFrom: string;
  effectiveTo: string;
  reportJanuary: string;
  needTable?: string;
  capacityTable?: string;
  appendixJanuary?: string;
  appendixJuly?: string;
  status: "source_catalogued" | "parameter_pending" | "verified";
};

export const HISTORICAL_NORM_SOURCE_CATALOG: readonly NormSourcePeriod[] = [
  {
    year: 2023,
    effectiveFrom: "2023-01-01",
    effectiveTo: "2023-12-31",
    reportJanuary: "https://www.rechtspraak.nl/SiteCollectionDocuments/tremarapport-versie-2023-januari.pdf",
    needTable: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2023",
    capacityTable: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2023",
    appendixJanuary: "https://www.rechtspraak.nl/binaries/content/assets/rvdr/wa/2023/rvdr-wa-2023-bijlage-2023-eerste-helft-rapport-alimentatienormen.pdf",
    appendixJuly: "https://www.rechtspraak.nl/binaries/content/assets/rvdr/wa/2023/rvdr-wa-2023-bijlage-2023-tweede-helft-rapport-alimentatienormen.pdf",
    status: "parameter_pending",
  },
  {
    year: 2022,
    effectiveFrom: "2022-01-01",
    effectiveTo: "2022-12-31",
    reportJanuary: "https://www.rechtspraak.nl/sitecollectiondocuments/tremarapport-versie-2022-januari.pdf",
    needTable: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2022",
    capacityTable: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2022",
    appendixJanuary: "https://www.rechtspraak.nl/sitecollectiondocuments/bijlage-rapport-alimentatienormen-2022-januari.pdf",
    appendixJuly: "https://www.rechtspraak.nl/sitecollectiondocuments/bijlage-rapport-alimentatienormen-2022-juli.pdf",
    status: "source_catalogued",
  },
  {
    year: 2021,
    effectiveFrom: "2021-01-01",
    effectiveTo: "2021-12-31",
    reportJanuary: "https://www.rechtspraak.nl/sitecollectiondocuments/tremarapport-versie-2021-januari.pdf",
    needTable: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2021",
    capacityTable: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2021",
    appendixJanuary: "https://www.rechtspraak.nl/sitecollectiondocuments/bijlage-rapport-alimentatienormen-2021-januari.pdf",
    appendixJuly: "https://www.rechtspraak.nl/sitecollectiondocuments/bijlage-rapport-alimentatienormen-2021-juli.pdf",
    status: "source_catalogued",
  },
] as const;

export const HISTORICAL_NORM_ARCHIVE_URL =
  "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen";

export function getHistoricalNormSource(year: number): NormSourcePeriod | undefined {
  return HISTORICAL_NORM_SOURCE_CATALOG.find((period) => period.year === year);
}
