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

/**
 * Verified 2023 values. This is intentionally limited to 2023 until the
 * corresponding historical periods have the same level of source review.
 */
export const HISTORICAL_NORM_PARAMETER_RECORDS: readonly HistoricalNormParameterRecord[] = [
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
