/**
 * Versioned registry for historical Expertgroep Alimentatienormen.
 *
 * This registry deliberately contains provenance and validity metadata, not
 * reconstructed financial values. A period may only be used for a calculation
 * once its official report/tables have been imported and verified.
 */

export type HistoricalNormStatus = "verified-source" | "parameters-pending";

export type HistoricalNormPeriod = {
  id: string;
  validFrom: string;
  validTo: string;
  reportYear: number;
  period: "full-year" | "H1" | "H2" | "july" | "april";
  reportTitle: string;
  sourceUrl: string;
  status: HistoricalNormStatus;
  notes?: string;
};

const RP = "https://www.rechtspraak.nl";

/**
 * Period catalogue from 2006 onward. Dates are intentionally explicit so a
 * calculation can never silently fall back to the current norm set.
 *
 * `parameters-pending` means the official source is not yet imported into the
 * executable norm dataset. Such a period must produce REVIEW_REQUIRED rather
 * than a guessed calculation.
 */
export const HISTORICAL_NORM_PERIODS: readonly HistoricalNormPeriod[] = [
  { id: "2006", validFrom: "2006-01-01", validTo: "2006-12-31", reportYear: 2006, period: "full-year", reportTitle: "Rapport Alimentatienormen 2006", sourceUrl: `${RP}/SiteCollectionDocuments/Rapport-alimentatienormen-2006.pdf`, status: "parameters-pending", notes: "Official historical source must be imported/verified before execution." },
  { id: "2007", validFrom: "2007-01-01", validTo: "2007-12-31", reportYear: 2007, period: "full-year", reportTitle: "Rapport Alimentatienormen 2007", sourceUrl: `${RP}/SiteCollectionDocuments/Rapport-alimentatienormen-2007.pdf`, status: "parameters-pending", notes: "Official historical source must be imported/verified before execution." },
  { id: "2008", validFrom: "2008-01-01", validTo: "2008-12-31", reportYear: 2008, period: "full-year", reportTitle: "Rapport Alimentatienormen versie augustus 2008", sourceUrl: `${RP}/SiteCollectionDocuments/Trema-rapportversie-2008-publicatie-exemplaar.pdf`, status: "parameters-pending", notes: "Source catalogued; financial parameters still require import and verification." },
  { id: "2009", validFrom: "2009-01-01", validTo: "2009-12-31", reportYear: 2009, period: "full-year", reportTitle: "Rapport Alimentatienormen versie 2009", sourceUrl: `${RP}/SiteCollectionDocuments/Trema-rapport-versie-2009-3.pdf`, status: "parameters-pending", notes: "Source catalogued; financial parameters still require import and verification." },
  { id: "2010", validFrom: "2010-01-01", validTo: "2010-12-31", reportYear: 2010, period: "full-year", reportTitle: "Rapport Alimentatienormen 2010", sourceUrl: `${RP}/SiteCollectionDocuments/Trema-rapport-versie-2010.pdf`, status: "parameters-pending", notes: "Official historical source must be imported/verified before execution." },
  { id: "2011-H2", validFrom: "2011-07-01", validTo: "2011-12-31", reportYear: 2011, period: "H2", reportTitle: "Bijlage 2011 tweede helft", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2011-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2012-H1", validFrom: "2012-01-01", validTo: "2012-06-30", reportYear: 2012, period: "H1", reportTitle: "Bijlage 2012 eerste helft", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2012-eerste-helft.pdf`, status: "parameters-pending" },
  { id: "2012-H2", validFrom: "2012-07-01", validTo: "2012-12-31", reportYear: 2012, period: "H2", reportTitle: "Bijlage 2012 tweede helft", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2012-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2013-H1", validFrom: "2013-01-01", validTo: "2013-06-30", reportYear: 2013, period: "H1", reportTitle: "Bijlage 2013 eerste helft", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2013-eerste-helft.pdf`, status: "parameters-pending" },
  { id: "2013-H2", validFrom: "2013-07-01", validTo: "2013-12-31", reportYear: 2013, period: "H2", reportTitle: "Bijlage 2013 tweede helft", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2013-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2014-H1", validFrom: "2014-01-01", validTo: "2014-06-30", reportYear: 2014, period: "H1", reportTitle: "Bijlage 2014 eerste helft", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2014-eerste-helft.pdf`, status: "parameters-pending" },
  { id: "2014-H2", validFrom: "2014-07-01", validTo: "2014-12-31", reportYear: 2014, period: "H2", reportTitle: "Bijlage 2014 tweede helft", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2014-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2015-H1", validFrom: "2015-01-01", validTo: "2015-06-30", reportYear: 2015, period: "H1", reportTitle: "Bijlage 2015 eerste helft", sourceUrl: `${RP}/binaries/content/assets/lbvr/an/lbvr-an-bijlage-2015-eerste-helft.pdf`, status: "parameters-pending" },
  { id: "2015-H2", validFrom: "2015-07-01", validTo: "2015-12-31", reportYear: 2015, period: "H2", reportTitle: "Bijlage 2015 tweede helft", sourceUrl: `${RP}/binaries/content/assets/lbvr/an/lbvr-an-bijlage-2015-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2016-H1", validFrom: "2016-01-01", validTo: "2016-06-30", reportYear: 2016, period: "H1", reportTitle: "Bijlage 2016 eerste helft", sourceUrl: `${RP}/SiteCollectionDocuments/bijlage-2016-eerste-helft.pdf`, status: "parameters-pending" },
  { id: "2016-H2", validFrom: "2016-07-01", validTo: "2016-12-31", reportYear: 2016, period: "H2", reportTitle: "Bijlage 2016 tweede helft", sourceUrl: `${RP}/SiteCollectionDocuments/bijlage-2016-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2017-H1", validFrom: "2017-01-01", validTo: "2017-06-30", reportYear: 2017, period: "H1", reportTitle: "Bijlage 2017 eerste helft", sourceUrl: `${RP}/binaries/content/assets/lbvr/an/bijlage-2017-eerste-helft.pdf`, status: "parameters-pending" },
  { id: "2017-H2", validFrom: "2017-07-01", validTo: "2017-12-31", reportYear: 2017, period: "H2", reportTitle: "Bijlage 2017 tweede helft", sourceUrl: `${RP}/binaries/content/assets/lbvr/an/bijlage-2017-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2018", validFrom: "2018-01-01", validTo: "2018-12-31", reportYear: 2018, period: "full-year", reportTitle: "Rapport Alimentatienormen 2018", sourceUrl: `${RP}/binaries/content/assets/lbvr/an/rapport-alimentatienormen-2018.pdf`, status: "parameters-pending" },
  { id: "2019", validFrom: "2019-01-01", validTo: "2019-12-31", reportYear: 2019, period: "full-year", reportTitle: "Rapport Alimentatienormen 2019", sourceUrl: `${RP}/binaries/content/assets/lbvr/an/rapport-alimentatienormen-2019.pdf`, status: "parameters-pending" },
  { id: "2020-H1", validFrom: "2020-01-01", validTo: "2020-06-30", reportYear: 2020, period: "H1", reportTitle: "Bijlage 2020 eerste helft", sourceUrl: `${RP}/binaries/content/assets/rvdr/wa/2020/rvdr-wa-2020-bijlage-2020-eerste-helft-rapport-alimentatienormen.pdf`, status: "parameters-pending" },
  { id: "2020-H2", validFrom: "2020-07-01", validTo: "2020-12-31", reportYear: 2020, period: "H2", reportTitle: "Bijlage 2020 tweede helft", sourceUrl: `${RP}/binaries/content/assets/rvdr/wa/2020/rvdr-wa-2020-bijlage-2020-tweede-helft-rapport-alimentatienormen.pdf`, status: "parameters-pending" },
  { id: "2021", validFrom: "2021-01-01", validTo: "2021-12-31", reportYear: 2021, period: "full-year", reportTitle: "Rapport Alimentatienormen 2021", sourceUrl: `${RP}/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen`, status: "parameters-pending" },
  { id: "2022", validFrom: "2022-01-01", validTo: "2022-12-31", reportYear: 2022, period: "full-year", reportTitle: "Rapport Alimentatienormen 2022", sourceUrl: `${RP}/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen`, status: "parameters-pending" },
  { id: "2023", validFrom: "2023-01-01", validTo: "2023-12-31", reportYear: 2023, period: "full-year", reportTitle: "Rapport Alimentatienormen 2023", sourceUrl: `${RP}/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen`, status: "parameters-pending" },
  { id: "2024", validFrom: "2024-01-01", validTo: "2024-12-31", reportYear: 2024, period: "full-year", reportTitle: "Rapport Alimentatienormen 2024", sourceUrl: `${RP}/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen`, status: "parameters-pending" },
  { id: "2025", validFrom: "2025-01-01", validTo: "2025-12-31", reportYear: 2025, period: "full-year", reportTitle: "Rapport Alimentatienormen 2025", sourceUrl: `${RP}/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen`, status: "parameters-pending" },
  { id: "2026-H1", validFrom: "2026-01-01", validTo: "2026-06-30", reportYear: 2026, period: "H1", reportTitle: "Rapport Alimentatienormen januari 2026", sourceUrl: `${RP}/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen`, status: "verified-source" },
  { id: "2026-H2", validFrom: "2026-07-01", validTo: "2026-12-31", reportYear: 2026, period: "H2", reportTitle: "Bijlage rapport Alimentatienormen juli 2026", sourceUrl: `${RP}/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen`, status: "verified-source" },
];

export function resolveHistoricalNormPeriod(calculationDate: string): HistoricalNormPeriod | null {
  const date = new Date(`${calculationDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return HISTORICAL_NORM_PERIODS.find((period) => {
    const from = new Date(`${period.validFrom}T00:00:00Z`);
    const to = new Date(`${period.validTo}T23:59:59Z`);
    return date >= from && date <= to;
  }) ?? null;
}

export function assertHistoricalNormExecutable(period: HistoricalNormPeriod): void {
  if (period.status !== "verified-source") {
    throw new Error(
      `REVIEW_REQUIRED: historische normset ${period.id} is geregistreerd, maar de officiële parameters zijn nog niet als uitvoerbare normset geverifieerd. Er wordt niet teruggevallen op 2026.`
    );
  }
}
