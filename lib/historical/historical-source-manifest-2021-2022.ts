/**
 * Official historical source manifest for 2021 and 2022.
 *
 * This is source coverage, not executable verification. Values must not be
 * marked verified until the complete parameter set and reference calculations
 * have been extracted and tested.
 */

export type HistoricalSourcePeriod = {
  periodId: string;
  effectiveFrom: string;
  reportUrl: string;
  needTableUrl: string;
  capacityTableUrl?: string;
  appendixUrls: readonly string[];
  verified: false;
};

export const HISTORICAL_SOURCE_MANIFEST_2021_2022: readonly HistoricalSourcePeriod[] = [
  {
    periodId: "2021-H1",
    effectiveFrom: "2021-01-01",
    reportUrl: "https://www.rechtspraak.nl/SiteCollectionDocuments/tremarapport-versie-2021-januari.pdf",
    needTableUrl: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2021",
    capacityTableUrl: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2021",
    appendixUrls: [
      "https://www.rechtspraak.nl/binaries/content/assets/rvdr/wa/2021/rvdr-wa-2021-bijlage-2021-eerste-helft-rapport-alimentatienormen.pdf",
      "https://www.rechtspraak.nl/binaries/content/assets/rvdr/wa/2021/rvdr-wa-2021-bijlage-2021-tweede-helft-rapport-alimentatienormen.pdf",
    ],
    verified: false,
  },
  {
    periodId: "2021-H2",
    effectiveFrom: "2021-07-01",
    reportUrl: "https://www.rechtspraak.nl/SiteCollectionDocuments/tremarapport-versie-2021-januari.pdf",
    needTableUrl: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2021",
    capacityTableUrl: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2021",
    appendixUrls: [
      "https://www.rechtspraak.nl/binaries/content/assets/rvdr/wa/2021/rvdr-wa-2021-bijlage-2021-tweede-helft-rapport-alimentatienormen.pdf",
    ],
    verified: false,
  },
  {
    periodId: "2022-H1",
    effectiveFrom: "2022-01-01",
    reportUrl: "https://www.rechtspraak.nl/sitecollectiondocuments/tremarapport-versie-2022-januari.pdf",
    needTableUrl: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2022",
    capacityTableUrl: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2022",
    appendixUrls: [
      "https://www.rechtspraak.nl/binaries/content/assets/rvdr/wa/2022/rvdr-wa-2022-bijlage-2022-eerste-helft-rapport-alimentatienormen.pdf",
    ],
    verified: false,
  },
  {
    periodId: "2022-H2",
    effectiveFrom: "2022-07-01",
    reportUrl: "https://www.rechtspraak.nl/sitecollectiondocuments/tremarapport-versie-2022-januari.pdf",
    needTableUrl: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2022",
    capacityTableUrl: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2022",
    appendixUrls: [
      "https://www.rechtspraak.nl/SiteCollectionDocuments/bijlage-2022-tweede-helft.pdf",
    ],
    verified: false,
  },
];
