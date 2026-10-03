import { roundCurrency } from "./calculation-rounding";

/**
 * 2027 calculation boundary.
 *
 * The official 2027 Rapport Alimentatienormen has not yet been published as
 * of 3 October 2026. This module therefore provides the complete calculation
 * contract and deterministic mechanics without inventing 2027 table values.
 * Official 2027 capacity results must be supplied explicitly until the
 * published 2027 report/tables are incorporated and independently verified.
 */

export type Trema2027ParentId = "A" | "B";

export interface Trema2027ParentInput {
  id: Trema2027ParentId;
  monthlyNbi: number;
  monthlyKgb?: number;
  kgbVerified?: boolean;
  officialCapacityMonthly: number;
}

export interface Trema2027Input {
  referenceYear: 2027;
  ownShareMonthly: number;
  exceptionalCostsMonthly?: number;
  alreadyIncludedExceptionalCostsMonthly?: number;
  payer: Trema2027ParentInput;
  recipient: Trema2027ParentInput;
  carePercentage?: number;
  careDiscountBaseMonthly?: number;
  careDiscountOverrideMonthly?: number;
  nonVerzilverbareKgbCorrectionMonthly?: number;
}

export interface Trema2027Step {
  key: string;
  formula: string;
  inputs: Record<string, unknown>;
  resultMonthly?: number;
}

export interface Trema2027Result {
  engineVersion: string;
  referenceYear: 2027;
  maximumContributionMonthly: number;
  payableMonthly: number;
  payerCapacityMonthly: number;
  recipientCapacityMonthly: number;
  steps: Trema2027Step[];
  warnings: string[];
  sources: string[];
}

export const TREMA_2027_ENGINE_VERSION = "4.0.0-trema-2027-contract";
export const TREMA_2027_STATUS = "provisional-awaiting-official-report" as const;

const round = (value: number): number => roundCurrency(value);
const nonNegative = (value: number): number => Math.max(0, round(value));

function finite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new Error(`${name} moet een eindig getal zijn.`);
}

function validateParent(parent: Trema2027ParentInput): void {
  finite(`ouder ${parent.id}: monthlyNbi`, parent.monthlyNbi);
  finite(`ouder ${parent.id}: monthlyKgb`, parent.monthlyKgb ?? 0);
  finite(`ouder ${parent.id}: officialCapacityMonthly`, parent.officialCapacityMonthly);
  if (parent.monthlyNbi < 0 || (parent.monthlyKgb ?? 0) < 0) {
    throw new Error(`Ouder ${parent.id}: inkomen en KGB mogen niet negatief zijn.`);
  }
  if (parent.officialCapacityMonthly < 0) {
    throw new Error(`Ouder ${parent.id}: officiële draagkracht mag niet negatief zijn.`);
  }
}

/**
 * Deterministic 2027 calculation using an explicitly supplied official
 * capacity result. This intentionally refuses to substitute 2026 constants.
 */
export function calculateTrema2027(input: Trema2027Input): Trema2027Result {
  if (input.referenceYear !== 2027) {
    throw new Error("Deze enginecore is uitsluitend bedoeld voor peiljaar 2027.");
  }
  finite("ownShareMonthly", input.ownShareMonthly);
  finite("exceptionalCostsMonthly", input.exceptionalCostsMonthly ?? 0);
  finite("alreadyIncludedExceptionalCostsMonthly", input.alreadyIncludedExceptionalCostsMonthly ?? 0);
  validateParent(input.payer);
  validateParent(input.recipient);

  if (input.ownShareMonthly <= 0) throw new Error("Het eigen aandeel/de behoefte moet groter zijn dan nul.");

  const warnings: string[] = [
    "2027 Trema-rapport/tabelwaarden zijn nog niet officieel gepubliceerd; capaciteit is daarom uitsluitend geldig wanneer de toepasselijke officiële 2027-tabelwaarde expliciet is aangeleverd.",
  ];
  if (input.payer.kgbVerified === false) warnings.push("Ouder A: KGB is niet als geverifieerd gemarkeerd.");
  if (input.recipient.kgbVerified === false) warnings.push("Ouder B: KGB is niet als geverifieerd gemarkeerd.");

  const steps: Trema2027Step[] = [];
  const exceptional = nonNegative((input.exceptionalCostsMonthly ?? 0) - (input.alreadyIncludedExceptionalCostsMonthly ?? 0));
  const totalNeed = round(input.ownShareMonthly + exceptional);
  const payerCapacity = nonNegative(input.payer.officialCapacityMonthly);
  const recipientCapacity = nonNegative(input.recipient.officialCapacityMonthly);
  const maximum = round(Math.min(totalNeed, payerCapacity));

  steps.push(
    {
      key: "need",
      formula: "totale behoefte = eigen aandeel + niet reeds opgenomen bijzondere kosten",
      inputs: {
        ownShareMonthly: input.ownShareMonthly,
        exceptionalCostsMonthly: input.exceptionalCostsMonthly ?? 0,
        alreadyIncludedExceptionalCostsMonthly: input.alreadyIncludedExceptionalCostsMonthly ?? 0,
      },
      resultMonthly: totalNeed,
    },
    {
      key: "capacity.A",
      formula: "draagkracht = expliciet aangeleverde officiële 2027-tabelwaarde",
      inputs: { officialCapacityMonthly: input.payer.officialCapacityMonthly },
      resultMonthly: payerCapacity,
    },
    {
      key: "capacity.B",
      formula: "draagkracht = expliciet aangeleverde officiële 2027-tabelwaarde",
      inputs: { officialCapacityMonthly: input.recipient.officialCapacityMonthly },
      resultMonthly: recipientCapacity,
    },
    {
      key: "maximum",
      formula: "maximum bijdrage = minimum van behoefte en draagkracht payer",
      inputs: { need: totalNeed, payerCapacity },
      resultMonthly: maximum,
    },
  );

  let careDiscount = 0;
  if (input.carePercentage !== undefined) {
    finite("carePercentage", input.carePercentage);
    if (input.carePercentage < 0 || input.carePercentage > 100) {
      throw new Error("Zorgkortingspercentage moet tussen 0 en 100 liggen.");
    }
    const base = input.careDiscountBaseMonthly ?? input.ownShareMonthly;
    finite("careDiscountBaseMonthly", base);
    careDiscount = nonNegative(input.careDiscountOverrideMonthly ?? round(base * input.carePercentage / 100));
    steps.push({
      key: "care-discount",
      formula: "zorgkorting = zorgkortingsgrondslag × zorgkortingspercentage",
      inputs: { base, percentage: input.carePercentage },
      resultMonthly: careDiscount,
    });
  }

  const kgbCorrection = nonNegative(input.nonVerzilverbareKgbCorrectionMonthly ?? 0);
  const payable = nonNegative(maximum - careDiscount - kgbCorrection);
  steps.push({
    key: "payable",
    formula: "te betalen = maximum bijdrage − zorgkorting − expliciete niet-verzilverbare-KGB-correctie",
    inputs: { maximum, careDiscount, kgbCorrection },
    resultMonthly: payable,
  });

  return {
    engineVersion: TREMA_2027_ENGINE_VERSION,
    referenceYear: 2027,
    maximumContributionMonthly: maximum,
    payableMonthly: payable,
    payerCapacityMonthly: payerCapacity,
    recipientCapacityMonthly: recipientCapacity,
    steps,
    warnings,
    sources: [
      "Rechtspraak — Expertgroep Alimentatienormen (2027 publication gate)",
      "Artikel 1:397 BW",
      "Artikel 1:404 BW",
    ],
  };
}
