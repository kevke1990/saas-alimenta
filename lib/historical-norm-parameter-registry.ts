/**
 * Historical norm parameter registry.
 *
 * Historical records are only marked verified when the corresponding values
 * have an explicit official source and locator. The registry does not by
 * itself make a period release-ready: rules, provenance and reference cases
 * are still required by the release gate.
 */

import { NORM_SETS, type NormYear } from "./norms";

export type HistoricalNormParameterStatus = "pending" | "verified";

export type HistoricalNormParameterKey =
  | "tableAmount"
  | "childBudget"
  | "incomeTaxParameters"
  | "socialPremiumParameters"
  | "minimumIncome"
  | "careReduction"
  | "otherRequiredNormInputs";

export type HistoricalNormParameterRecord = {
  periodId: string;
  key: HistoricalNormParameterKey;
  status: HistoricalNormParameterStatus;
  sourceUrl: string;
  sourceLocator: string;
  sourceDate?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
};

export const HISTORICAL_NORM_PARAMETER_KEYS: readonly HistoricalNormParameterKey[] = [
  "tableAmount",
  "childBudget",
  "incomeTaxParameters",
  "socialPremiumParameters",
  "minimumIncome",
  "careReduction",
  "otherRequiredNormInputs",
];

const RECHTSPRAAK_2023_APPENDIX =
  "https://www.rechtspraak.nl/binaries/_rts_1768838151764/content/assets/rvdr/wa/2023/rvdr-wa-2023-bijlage-2023-eerste-helft-rapport-alimentatienormen.pdf";
const RECHTSPRAAK_2023_NEED =
  "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2023";
const RECHTSPRAAK_2023_CAPACITY =
  "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2023";

const RECHTSPRAAK_2012_REPORT =
  "https://www.rechtspraak.nl/binaries/_rts_1768896833188/content/assets/lbvr/an/lbvr-an-rapport-alimentatienormen-2012.pdf";
const RECHTSPRAAK_2012_H1 =
  "https://www.rechtspraak.nl/binaries/_rts_1769091268416/content/assets/lbvr/an/lbvr-an-bijlage-2012-eerste-helft.pdf";
const RECHTSPRAAK_2012_H2 =
  "https://www.rechtspraak.nl/binaries/_rts_1769091269183/content/assets/lbvr/an/lbvr-an-bijlage-2012-tweede-helft.pdf";

/**
 * Verified historical parameter records. A period becomes executable only
 * after all required keys are present and verified; partial historical data
 * therefore remains fail-closed by design.
 */
export const HISTORICAL_NORM_PARAMETER_RECORDS: readonly HistoricalNormParameterRecord[] = [
  {
    periodId: "2012-H1",
    key: "tableAmount",
    status: "verified",
    sourceUrl: RECHTSPRAAK_2012_H1,
    sourceLocator: "Paragraaf 28, tabellen 1 en 2, pp. 13-15: eigen aandeel kosten kinderen",
    sourceDate: "2012-01-01",
    notes: "Values transcribed into historical-2012-norm-data.ts; January and July 2012 tables match for this section.",
  },
  {
    periodId: "2012-H2",
    key: "tableAmount",
    status: "verified",
    sourceUrl: RECHTSPRAAK_2012_H2,
    sourceLocator: "Paragraaf 28, tabellen 1 en 2, pp. 13-15: eigen aandeel kosten kinderen",
    sourceDate: "2012-07-01",
    notes: "Values transcribed into historical-2012-norm-data.ts; January and July 2012 tables match for this section.",
  },
  {
    periodId: "2012-H1",
    key: "minimumIncome",
    status: "verified",
    sourceUrl: RECHTSPRAAK_2012_H1,
    sourceLocator: "Paragraaf 9: bijstandsnorm inclusief vakantietoeslag; paragraaf 10: gemiddelde basishuur",
    sourceDate: "2012-01-01",
    notes: "January 2012: married €1,336; single parent €1,203; single €935; average basic rent €213.",
  },
  {
    periodId: "2012-H2",
    key: "minimumIncome",
    status: "verified",
    sourceUrl: RECHTSPRAAK_2012_H2,
    sourceLocator: "Paragraaf 9: bijstandsnorm inclusief vakantietoeslag; paragraaf 10: gemiddelde basishuur",
    sourceDate: "2012-07-01",
    notes: "July 2012: married €1,337; single parent €1,203; single €936; average basic rent €213.",
  },
  {
    periodId: "2023",
    key: "tableAmount",
    status: "verified",
    sourceUrl: RECHTSPRAAK_2023_NEED,
    sourceLocator: "Tabel eigen aandeel kosten van kinderen; 1-4 kinderen; NBI 1500-6000",
    sourceDate: "2023-01-01",
    notes: "Official 2023 need table published by Rechtspraak.",
  },
  {
    periodId: "2023",
    key: "childBudget",
    status: "verified",
    sourceUrl: RECHTSPRAAK_2023_NEED,
    sourceLocator: "Bedragen studiefinanciering; mbo and hbo/university 2023 periods",
    sourceDate: "2023-01-01",
  },
  {
    periodId: "2023",
    key: "incomeTaxParameters",
    status: "verified",
    sourceUrl: RECHTSPRAAK_2023_APPENDIX,
    sourceLocator: "Bijlage januari 2023: belastingtarieven, heffingskortingen, aftrekposten, box 3 en aanmerkelijk belang",
    sourceDate: "2023-01-01",
  },
  {
    periodId: "2023",
    key: "socialPremiumParameters",
    status: "verified",
    sourceUrl: RECHTSPRAAK_2023_APPENDIX,
    sourceLocator: "Bijlage januari 2023: ZVW 5,43%/6,68%, maximum bijdrageloon €66.956 en nominale premie",
    sourceDate: "2023-01-01",
  },
  {
    periodId: "2023",
    key: "minimumIncome",
    status: "verified",
    sourceUrl: RECHTSPRAAK_2023_APPENDIX,
    sourceLocator: "Bijlage januari 2023: bijstandsnormen januari/juli 2023 en woonbudget/wooncomponent",
    sourceDate: "2023-01-01",
  },
  {
    periodId: "2023",
    key: "careReduction",
    status: "verified",
    sourceUrl: RECHTSPRAAK_2023_APPENDIX,
    sourceLocator: "Bijlage januari 2023: zorgkortingstabel en aanbevelingen zorgkorting",
    sourceDate: "2023-01-01",
  },
  {
    periodId: "2023",
    key: "otherRequiredNormInputs",
    status: "verified",
    sourceUrl: RECHTSPRAAK_2023_APPENDIX,
    sourceLocator: "Bijlage januari 2023: vakantiebonnen, heffingskortingen, box-3-rendementen, bijstandsnormen en overige norminputs",
    sourceDate: "2023-01-01",
  },
  {
    periodId: "2006-H1",
    key: "minimumIncome",
    status: "verified",
    sourceUrl: "https://www.rechtspraak.nl/SiteCollectionDocuments/Bijlage-2006-eerste-helft.pdf",
    sourceLocator: "Paragraaf 9, p. 2: bijstandsnorm inclusief vakantiegeld; paragraaf 10: gemiddelde basishuur",
    sourceDate: "2006-01-01",
    notes: "January 2006: married €1,201; single parent €1,081; single €841; average basic rent €190.",
  },
  {
    periodId: "2006-H2",
    key: "minimumIncome",
    status: "verified",
    sourceUrl: "https://www.rechtspraak.nl/SiteCollectionDocuments/Bijlage-2006-tweede-helft.pdf",
    sourceLocator: "Paragraaf 9, p. 10: bijstandsnorm inclusief vakantietoeslag; paragraaf 10: gemiddelde basishuur",
    sourceDate: "2006-07-01",
    notes: "July 2006: married €1,208; single parent €1,087; single €846; average basic rent €197.",
  },
  {
    periodId: "2006-H2",
    key: "tableAmount",
    status: "verified",
    sourceUrl: "https://www.rechtspraak.nl/SiteCollectionDocuments/Bijlage-2006-tweede-helft.pdf",
    sourceLocator: "Paragraaf 28, tabellen 1 en 2, p. 11: kinderbijslagpunten en eigen aandeel kosten van kinderen",
    sourceDate: "2006-07-01",
    notes: "Official July 2006 table located; the complete table is not yet transcribed into runtime data and other required parameter groups remain pending.",
  },
];

export function getHistoricalNormParameterRecords(periodId: string): readonly HistoricalNormParameterRecord[] {
  return HISTORICAL_NORM_PARAMETER_RECORDS.filter((record) => record.periodId === periodId);
}

export function isHistoricalNormParameterSetComplete(periodId: string): boolean {
  const records = getHistoricalNormParameterRecords(periodId);
  return HISTORICAL_NORM_PARAMETER_KEYS.every((key) =>
    records.some((record) => record.key === key && record.status === "verified"),
  );
}

export function isExecutableCurrentNormPeriod(periodId: string): boolean {
  const match = /^(2024|2025|2026)(?:-H[12])?$/.exec(periodId);
  if (!match) return false;
  const year = Number(match[1]) as NormYear;
  return Boolean(NORM_SETS[year]);
}

export function isNormPeriodExecutable(periodId: string): boolean {
  return isExecutableCurrentNormPeriod(periodId) || isHistoricalNormParameterSetComplete(periodId);
}

export function assertHistoricalNormParameterSetComplete(periodId: string): void {
  if (!isHistoricalNormParameterSetComplete(periodId)) {
    throw new Error(
      `REVIEW_REQUIRED: historische normparameter-set ${periodId} is niet volledig en mag niet worden uitgevoerd.`,
    );
  }
}

export function assertNormPeriodExecutable(periodId: string): void {
  if (!isNormPeriodExecutable(periodId)) {
    throw new Error(
      `REVIEW_REQUIRED: normperiode ${periodId} heeft geen volledig geverifieerde uitvoerbare normset.`,
    );
  }
}
