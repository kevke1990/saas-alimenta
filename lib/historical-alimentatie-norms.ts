/**
 * Versioned registry for historical Expertgroep Alimentatienormen.
 *
 * A period is executable only when its underlying parameter set is known to
 * be executable. Current 2024-2026 norm sets are supplied by norms.ts;
 * historical years remain fail-closed until independently verified.
 */

import { isNormPeriodExecutable } from "./historical-norm-parameter-registry";

export type HistoricalNormStatus = "parameters-pending" | "parameters-verified";

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
const ALIMENTATIENORMEN_PAGE = `${RP}/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen`;

export const HISTORICAL_NORM_PERIODS: readonly HistoricalNormPeriod[] = [
  { id: "2006-H1", validFrom: "2006-01-01", validTo: "2006-06-30", reportYear: 2006, period: "H1", reportTitle: "Bijlage 2006, eerste helft (januari)", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2006-eerste-helft.pdf`, status: "parameters-pending", notes: "Official January 2006 appendix. Exact applicable table values and fiscal inputs remain pending verification." },
  { id: "2006-H2", validFrom: "2006-07-01", validTo: "2006-12-31", reportYear: 2006, period: "H2", reportTitle: "Bijlage 2006, tweede helft (juli)", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2006-tweede-helft.pdf`, status: "parameters-pending", notes: "Official July 2006 appendix. Exact applicable table values and fiscal inputs remain pending verification." },
  { id: "2007-H1", validFrom: "2007-01-01", validTo: "2007-06-30", reportYear: 2007, period: "H1", reportTitle: "Bijlage 2007, eerste helft (januari 2007)", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2007-eerste-helft.pdf`, status: "parameters-pending", notes: "Official appendix states updates effective 1 January 2007 and refers to the September 2006 report." },
  { id: "2007-H2", validFrom: "2007-07-01", validTo: "2007-12-31", reportYear: 2007, period: "H2", reportTitle: "Bijlage 2007, tweede helft (juli 2007)", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2007-tweede-helft.pdf`, status: "parameters-pending", notes: "Official appendix states updates effective 1 July 2007. Full period-specific parameter verification remains pending." },
  { id: "2008-H1", validFrom: "2008-01-01", validTo: "2008-06-30", reportYear: 2008, period: "H1", reportTitle: "Bijlage januari 2008", sourceUrl: `${RP}/SiteCollectionDocuments/bijlage2008eerstehelft.pdf`, status: "parameters-pending", notes: "Official January appendix states changes effective 1 January 2008, including tax, child benefit and health-premium rules." },
  { id: "2008-H2", validFrom: "2008-07-01", validTo: "2008-12-31", reportYear: 2008, period: "H2", reportTitle: "Bijlage juli 2008", sourceUrl: `${RP}/SiteCollectionDocuments/bijlage2008tweedehelft.pdf`, status: "parameters-pending", notes: "Official July appendix states changes effective 1 July 2008, including assistance norms and average basic rent." },
  { id: "2009-H1", validFrom: "2009-01-01", validTo: "2009-06-30", reportYear: 2009, period: "H1", reportTitle: "Bijlage januari 2009", sourceUrl: `${RP}/SiteCollectionDocuments/bijlage2009eerstehelft.pdf`, status: "parameters-pending", notes: "Official January appendix states changes effective 1 January 2009, including taxes, child benefit and ZVW parameters." },
  { id: "2009-H2", validFrom: "2009-07-01", validTo: "2009-12-31", reportYear: 2009, period: "H2", reportTitle: "Bijlage juli 2009", sourceUrl: `${RP}/SiteCollectionDocuments/bijlage2009tweedehelft.pdf`, status: "parameters-pending", notes: "Official July appendix is separately published; its complete parameter changes must be extracted and verified." },
  { id: "2010-H1", validFrom: "2010-01-01", validTo: "2010-06-30", reportYear: 2010, period: "H1", reportTitle: "Bijlage januari 2010", sourceUrl: `${RP}/SiteCollectionDocuments/bijlage2010eerstehelft.pdf`, status: "parameters-pending", notes: "Official January appendix states changes effective 1 January 2010, including taxes, ZVW and child-support tax-credit threshold." },
  { id: "2010-H2", validFrom: "2010-07-01", validTo: "2010-12-31", reportYear: 2010, period: "H2", reportTitle: "Bijlage juli 2010", sourceUrl: `${RP}/SiteCollectionDocuments/bijlage2010tweedehelft1.pdf`, status: "parameters-pending", notes: "Official July appendix states changes effective 1 July 2010, including assistance norms and the Recofa guideline." },
  { id: "2011-H1", validFrom: "2011-01-01", validTo: "2011-06-30", reportYear: 2011, period: "H1", reportTitle: "2011 eerste helft (bronpublicatie nog niet gevonden)", sourceUrl: ALIMENTATIENORMEN_PAGE, status: "parameters-pending", notes: "The official archive currently lists only a second-half 2011 appendix. Verify whether the July 2010 appendix remained applicable or locate the January 2011 source before execution." },
  { id: "2011-H2", validFrom: "2011-07-01", validTo: "2011-12-31", reportYear: 2011, period: "H2", reportTitle: "Bijlage 2011, tweede helft (juli)", sourceUrl: `${RP}/binaries/_rts_1769091122481/content/assets/lbvr/an/lbvr-an-bijlage-2011-tweede-helft.pdf`, status: "parameters-pending", notes: "Official July appendix documents net-method inputs; complete period parameters and reference calculations remain pending." },
  { id: "2012-H1", validFrom: "2012-01-01", validTo: "2012-06-30", reportYear: 2012, period: "H1", reportTitle: "Bijlage 2012 eerste helft", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2012-eerste-helft.pdf`, status: "parameters-pending" },
  { id: "2012-H2", validFrom: "2012-07-01", validTo: "2012-12-31", reportYear: 2012, period: "H2", reportTitle: "Bijlage 2012 tweede helft", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2012-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2013-H1", validFrom: "2013-01-01", validTo: "2013-03-31", reportYear: 2013, period: "H1", reportTitle: "Rapport Alimentatienormen versie januari 2013", sourceUrl: ALIMENTATIENORMEN_PAGE, status: "parameters-pending", notes: "The April 2013 report gives a transition regime: January–March 2013 uses the new need method but the old capacity method." },
  { id: "2013-APR", validFrom: "2013-04-01", validTo: "2013-06-30", reportYear: 2013, period: "april", reportTitle: "Rapport Alimentatienormen versie april 2013", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768562463923/content/assets/gharl/rv/gharl-rv-rapport-alimentatienormen-2013.pdf", status: "parameters-pending", notes: "The official report says the new child-support calculation method takes effect 1 April 2013. Full period-specific parameter and transition-rule verification remains pending." },
  { id: "2013-H2", validFrom: "2013-07-01", validTo: "2013-12-31", reportYear: 2013, period: "H2", reportTitle: "Bijlage 2013 tweede helft", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2013-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2014-H1", validFrom: "2014-01-01", validTo: "2014-06-30", reportYear: 2014, period: "H1", reportTitle: "Bijlage 2014 eerste helft", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2014-eerste-helft.pdf`, status: "parameters-pending" },
  { id: "2014-H2", validFrom: "2014-07-01", validTo: "2014-12-31", reportYear: 2014, period: "H2", reportTitle: "Bijlage 2014 tweede helft", sourceUrl: `${RP}/SiteCollectionDocuments/Bijlage-2014-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2015-H1", validFrom: "2015-01-01", validTo: "2015-06-30", reportYear: 2015, period: "H1", reportTitle: "Bijlage 2015 eerste helft", sourceUrl: `${RP}/binaries/content/assets/lbvr/an/lbvr-an-bijlage-2015-eerste-helft.pdf`, status: "parameters-pending" },
  { id: "2015-H2", validFrom: "2015-07-01", validTo: "2015-12-31", reportYear: 2015, period: "H2", reportTitle: "Bijlage 2015 tweede helft", sourceUrl: `${RP}/binaries/content/assets/lbvr/an/lbvr-an-bijlage-2015-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2016-H1", validFrom: "2016-01-01", validTo: "2016-06-30", reportYear: 2016, period: "H1", reportTitle: "Bijlage 2016 eerste helft", sourceUrl: `${RP}/SiteCollectionDocuments/bijlage-2016-eerste-helft.pdf`, status: "parameters-pending" },
  { id: "2016-H2", validFrom: "2016-07-01", validTo: "2016-12-31", reportYear: 2016, period: "H2", reportTitle: "Bijlage 2016 tweede helft", sourceUrl: `${RP}/SiteCollectionDocuments/bijlage-2016-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2017-H1", validFrom: "2017-01-01", validTo: "2017-06-30", reportYear: 2017, period: "H1", reportTitle: "Bijlage 2017 eerste helft", sourceUrl: `${RP}/binaries/content/assets/lbvr/an/bijlage-2017-eerste-helft.pdf`, status: "parameters-pending" },
  { id: "2017-H2", validFrom: "2017-07-01", validTo: "2017-12-31", reportYear: 2017, period: "H2", reportTitle: "Bijlage 2017 tweede helft", sourceUrl: `${RP}/binaries/content/assets/lbvr/an/bijlage-2017-tweede-helft.pdf`, status: "parameters-pending" },
  { id: "2018-H1", validFrom: "2018-01-01", validTo: "2018-06-30", reportYear: 2018, period: "H1", reportTitle: "Bijlage januari 2018", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1769091278345/content/assets/lbvr/an/lbvr-an-bijlage-2018-eerste-helft.pdf", status: "parameters-pending" },
  { id: "2018-H2", validFrom: "2018-07-01", validTo: "2018-12-31", reportYear: 2018, period: "H2", reportTitle: "Bijlage juli 2018", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1769091279153/content/assets/lbvr/an/lbvr-an-bijlage-2018-tweede-helft.pdf", status: "parameters-pending" },
  { id: "2019-H1", validFrom: "2019-01-01", validTo: "2019-06-30", reportYear: 2019, period: "H1", reportTitle: "Bijlage januari 2019", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768837987510/content/assets/rvdr/wa/2019/rvdr-wa-2019-bijlage-2019-eerste-helft-rapport-alimentatienormen.pdf", status: "parameters-pending" },
  { id: "2019-H2", validFrom: "2019-07-01", validTo: "2019-12-31", reportYear: 2019, period: "H2", reportTitle: "Bijlage juli 2019", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768837989522/content/assets/rvdr/wa/2019/rvdr-wa-2019-bijlage-2019-tweede-helft-rapport-alimentatienormen.pdf", status: "parameters-pending" },
  { id: "2020-H1", validFrom: "2020-01-01", validTo: "2020-06-30", reportYear: 2020, period: "H1", reportTitle: "Bijlage 2020 eerste helft", sourceUrl: `${RP}/binaries/content/assets/rvdr/wa/2020/rvdr-wa-2020-bijlage-2020-eerste-helft-rapport-alimentatienormen.pdf`, status: "parameters-pending" },
  { id: "2020-H2", validFrom: "2020-07-01", validTo: "2020-12-31", reportYear: 2020, period: "H2", reportTitle: "Bijlage 2020 tweede helft", sourceUrl: `${RP}/binaries/content/assets/rvdr/wa/2020/rvdr-wa-2020-bijlage-2020-tweede-helft-rapport-alimentatienormen.pdf`, status: "parameters-pending" },
  { id: "2021-H1", validFrom: "2021-01-01", validTo: "2021-06-30", reportYear: 2021, period: "H1", reportTitle: "Bijlage januari 2021", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768838071498/content/assets/rvdr/wa/2021/rvdr-wa-2021-bijlage-2021-eerste-helft-rapport-alimentatienormen.pdf", status: "parameters-pending" },
  { id: "2021-H2", validFrom: "2021-07-01", validTo: "2021-12-31", reportYear: 2021, period: "H2", reportTitle: "Bijlage juli 2021", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768838073165/content/assets/rvdr/wa/2021/rvdr-wa-2021-bijlage-2021-tweede-helft-rapport-alimentatienormen.pdf", status: "parameters-pending" },
  { id: "2022-H1", validFrom: "2022-01-01", validTo: "2022-06-30", reportYear: 2022, period: "H1", reportTitle: "Bijlage januari 2022", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768838104535/content/assets/rvdr/wa/2022/rvdr-wa-2022-bijlage-2022-eerste-helft-rapport-alimentatienormen.pdf", status: "parameters-pending" },
  { id: "2022-H2", validFrom: "2022-07-01", validTo: "2022-12-31", reportYear: 2022, period: "H2", reportTitle: "Bijlage juli 2022", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768838106091/content/assets/rvdr/wa/2022/rvdr-wa-2022-bijlage-2022-tweede-helft-rapport-alimentatienormen.pdf", status: "parameters-pending" },
  { id: "2023-H1", validFrom: "2023-01-01", validTo: "2023-06-30", reportYear: 2023, period: "H1", reportTitle: "Bijlage januari 2023", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768838151764/content/assets/rvdr/wa/2023/rvdr-wa-2023-bijlage-2023-eerste-helft-rapport-alimentatienormen.pdf", status: "parameters-pending" },
  { id: "2023-H2", validFrom: "2023-07-01", validTo: "2023-12-31", reportYear: 2023, period: "H2", reportTitle: "Bijlage juli 2023", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768838152841/content/assets/rvdr/wa/2023/rvdr-wa-2023-bijlage-2023-tweede-helft-rapport-alimentatienormen.pdf", status: "parameters-pending" },
  { id: "2024-H1", validFrom: "2024-01-01", validTo: "2024-06-30", reportYear: 2024, period: "H1", reportTitle: "Bijlagen rapport Alimentatienormen eerste helft 2024", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768838193397/content/assets/rvdr/wa/2024/rvdr-wa-2024-bijlagen-rapport-alimentatienormen-eerste-helft.pdf", status: "parameters-verified", notes: "Current NORM_SETS[2024] is available; period-specific supplementary values remain date-selected within that set." },
  { id: "2024-H2", validFrom: "2024-07-01", validTo: "2024-12-31", reportYear: 2024, period: "H2", reportTitle: "Bijlagen rapport Alimentatienormen tweede helft 2024", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768838195483/content/assets/rvdr/wa/2024/rvdr-wa-2024-bijlagen-rapport-alimentatienormen-tweede-helft.pdf", status: "parameters-verified", notes: "Current NORM_SETS[2024] is available; period-specific supplementary values remain date-selected within that set." },
  { id: "2025-H1", validFrom: "2025-01-01", validTo: "2025-06-30", reportYear: 2025, period: "H1", reportTitle: "Bijlagen rapport Alimentatienormen eerste helft 2025", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768838243183/content/assets/rvdr/wa/2025/rvdr-wa-2025-bijlagen-rapport-alimentatienormen-eerste-helft.pdf", status: "parameters-verified", notes: "Current NORM_SETS[2025] is available; period-specific supplementary values remain date-selected within that set." },
  { id: "2025-H2", validFrom: "2025-07-01", validTo: "2025-12-31", reportYear: 2025, period: "H2", reportTitle: "Bijlagen rapport Alimentatienormen tweede helft 2025", sourceUrl: "https://www.rechtspraak.nl/binaries/_rts_1768838245394/content/assets/rvdr/wa/2025/rvdr-wa-2025-bijlagen-rapport-alimentatienormen-tweede-helft.pdf", status: "parameters-verified", notes: "Current NORM_SETS[2025] is available; period-specific supplementary values remain date-selected within that set." },
  { id: "2026-H1", validFrom: "2026-01-01", validTo: "2026-06-30", reportYear: 2026, period: "H1", reportTitle: "Rapport Alimentatienormen januari 2026", sourceUrl: ALIMENTATIENORMEN_PAGE, status: "parameters-verified", notes: "Executable via NORM_SETS[2026] already present in norms.ts." },
  { id: "2026-H2", validFrom: "2026-07-01", validTo: "2026-12-31", reportYear: 2026, period: "H2", reportTitle: "Bijlage rapport Alimentatienormen juli 2026", sourceUrl: ALIMENTATIENORMEN_PAGE, status: "parameters-verified", notes: "Executable via NORM_SETS[2026] already present in norms.ts." },
];

export function resolveHistoricalNormPeriod(calculationDate: string): HistoricalNormPeriod | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(calculationDate)) return null;
  const date = new Date(`${calculationDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== calculationDate) return null;
  return HISTORICAL_NORM_PERIODS.find((period) => {
    const from = new Date(`${period.validFrom}T00:00:00Z`);
    const to = new Date(`${period.validTo}T23:59:59Z`);
    return date >= from && date <= to;
  }) ?? null;
}

export function assertHistoricalNormExecutable(period: HistoricalNormPeriod): void {
  if (!isNormPeriodExecutable(period.id)) {
    throw new Error(
      `REVIEW_REQUIRED: historische normset ${period.id} is geregistreerd, maar de officiële parameters zijn nog niet als uitvoerbare normset geverifieerd. Er wordt niet teruggevallen op 2026.`,
    );
  }
}
