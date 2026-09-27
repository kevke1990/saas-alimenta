/**
 * Official source catalog for historical Expertgroep Alimentatienormen.
 *
 * Provenance metadata only. A period must not become executable until every
 * parameter used by the calculation adapter has been extracted and independently
 * verified against the cited source documents.
 */

export type NormSourcePeriod = {
  year: number;
  effectiveFrom: string;
  effectiveTo: string;
  reportJanuary?: string;
  reportApril?: string;
  reportJuly?: string;
  needTable?: string;
  capacityTable?: string;
  appendixJanuary?: string;
  appendixApril?: string;
  appendixJuly?: string;
  sourceArchive: string;
  status: "source_catalogued" | "parameter_pending" | "verified";
};

const ARCHIVE =
  "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen";

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
    sourceArchive: ARCHIVE,
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
    sourceArchive: ARCHIVE,
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
    sourceArchive: ARCHIVE,
    status: "source_catalogued",
  },
  {
    year: 2020,
    effectiveFrom: "2020-01-01",
    effectiveTo: "2020-12-31",
    reportJanuary: "https://www.rechtspraak.nl/binaries/_rts_1768401096875/content/assets/lbvr/an/lbvr-an-tremarapport-versie-2020-januari.pdf",
    sourceArchive: ARCHIVE,
    status: "source_catalogued",
  },
  {
    year: 2019,
    effectiveFrom: "2019-01-01",
    effectiveTo: "2019-12-31",
    reportJanuary: "https://www.rechtspraak.nl/binaries/_rts_1768401095325/content/assets/lbvr/an/lbvr-an-tremarapport-versie-2019-januari.pdf",
    sourceArchive: ARCHIVE,
    status: "source_catalogued",
  },
  {
    year: 2018,
    effectiveFrom: "2018-01-01",
    effectiveTo: "2018-12-31",
    reportJanuary: "https://www.rechtspraak.nl/binaries/_rts_1768915116756/content/assets/lbvr/an/lbvr-an-tremarapport-2018-januari.pdf",
    sourceArchive: ARCHIVE,
    status: "source_catalogued",
  },
  {
    year: 2017,
    effectiveFrom: "2017-01-01",
    effectiveTo: "2017-12-31",
    reportJanuary: "https://www.rechtspraak.nl/binaries/_rts_1768896838166/content/assets/lbvr/an/lbvr-an-rapport-alimentatienormen-2017.pdf",
    sourceArchive: ARCHIVE,
    status: "source_catalogued",
  },
  // Older periods are deliberately catalogued from the official archive first.
  // Exact document URLs and parameter locators must be extracted before these
  // periods can become executable; never infer them from a neighbouring year.
  {
    year: 2016,
    effectiveFrom: "2016-01-01",
    effectiveTo: "2016-12-31",
    sourceArchive: ARCHIVE,
    status: "source_catalogued",
  },
  {
    year: 2015,
    effectiveFrom: "2015-01-01",
    effectiveTo: "2015-12-31",
    sourceArchive: ARCHIVE,
    status: "source_catalogued",
  },
  {
    year: 2014,
    effectiveFrom: "2014-01-01",
    effectiveTo: "2014-12-31",
    sourceArchive: ARCHIVE,
    status: "source_catalogued",
  },
  {
    year: 2013,
    effectiveFrom: "2013-01-01",
    effectiveTo: "2013-12-31",
    sourceArchive: ARCHIVE,
    status: "source_catalogued",
  },
] as const;

export const HISTORICAL_NORM_ARCHIVE_URL = ARCHIVE;

export function getHistoricalNormSource(year: number): NormSourcePeriod | undefined {
  return HISTORICAL_NORM_SOURCE_CATALOG.find((period) => period.year === year);
}
