/**
 * Trema/Alimentatienormen 2026 calculation core.
 *
 * This module implements the published 2026 core schema. Year-specific
 * tables and factual inputs are explicit dependencies; the engine refuses
 * to silently invent missing table values.
 */

export type ParentId = "A" | "B";
export type Household = "single" | "married" | "pension";

export interface IncomeInput {
  monthlyNbi: number;
  monthlyKgb?: number;
  kgbVerified?: boolean;
  referenceYear: number;
}

export interface CapacityInput {
  income: IncomeInput;
  household: Household;
  grossModelUsed?: boolean;
  aowEligible?: boolean;
  otherNecessaryCostsMonthly?: number;
  existingChildSupportMonthly?: number;
  otherPriorityMaintenanceMonthly?: number;
  professionalCorrectionMonthly?: number;
  correctedAssistanceNormMonthly?: number;
  normRentComponentMonthly?: number;
  healthPremiumMonthly?: number;
  healthNormPremiumMonthly?: number;
  unforeseenCostsMonthly?: number;
}

export interface ParentCalculationInput {
  id: ParentId;
  capacity: CapacityInput;
}

export interface CareInput {
  carePercentage: number;
  careDiscountBaseMonthly?: number;
  careDiscountOverrideMonthly?: number;
}

export interface NeedInput {
  ownShareMonthly: number;
  exceptionalCostsMonthly?: number;
  alreadyIncludedExceptionalCostsMonthly?: number;
}

export interface Trema2026Input {
  referenceYear: 2026;
  need: NeedInput;
  payer: ParentCalculationInput;
  recipient: ParentCalculationInput;
  care?: CareInput;
  nonVerzilverbareKgbCorrectionMonthly?: number;
}

export interface FormulaStep {
  key: string;
  formula: string;
  inputs: Record<string, number | string | boolean | undefined>;
  resultMonthly?: number;
  note?: string;
}

export interface Trema2026Result {
  engineVersion: string;
  referenceYear: number;
  maximumContributionMonthly: number;
  payableMonthly: number;
  payerCapacityMonthly: number;
  recipientCapacityMonthly: number;
  steps: FormulaStep[];
  warnings: string[];
  sources: string[];
}

export const TREMA_2026_ENGINE_VERSION = "3.0.0-trema-2026-core";
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const nonNegative = (n: number) => Math.max(0, round(n));

/**
 * 2026 corrected assistance norm from the report's published example.
 * For production use, the applicable half-year and household-specific value
 * must be supplied explicitly because these values can change.
 */
export function correctedAssistanceNorm2026(input: {
  assistanceNormMonthly: number;
  housingComponentMonthly: number;
  healthPremiumMonthly: number;
  healthNormPremiumMonthly: number;
  unforeseenCostsMonthly: number;
  aowEligible?: boolean;
}): number {
  const base = input.assistanceNormMonthly - input.housingComponentMonthly;
  const health = input.healthPremiumMonthly - input.healthNormPremiumMonthly;
  const result = base + health + input.unforeseenCostsMonthly;
  const rounded = Math.round(result / 5) * 5;
  return input.aowEligible ? Math.max(rounded, 1525) : rounded;
}

export function calculateCorrectedNorm(capacity: CapacityInput): number {
  if (capacity.correctedAssistanceNormMonthly !== undefined) {
    return nonNegative(capacity.correctedAssistanceNormMonthly);
  }
  if (
    capacity.normRentComponentMonthly === undefined ||
    capacity.healthPremiumMonthly === undefined ||
    capacity.healthNormPremiumMonthly === undefined ||
    capacity.unforeseenCostsMonthly === undefined
  ) {
    throw new Error("Ontbrekende invoer voor de gecorrigeerde bijstandsnorm; lever de toepasselijke 2026-waarde of alle componenten aan.");
  }
  return correctedAssistanceNorm2026({
    assistanceNormMonthly: capacity.household === "pension" ? 1565 : 1402,
    housingComponentMonthly: capacity.normRentComponentMonthly,
    healthPremiumMonthly: capacity.healthPremiumMonthly,
    healthNormPremiumMonthly: capacity.healthNormPremiumMonthly,
    unforeseenCostsMonthly: capacity.unforeseenCostsMonthly,
    aowEligible: capacity.aowEligible,
  });
}

export function calculateTrema2026(input: Trema2026Input): Trema2026Result {
  if (input.referenceYear !== 2026) throw new Error("Deze enginecore is uitsluitend bedoeld voor peiljaar 2026.");
  const warnings: string[] = [];
  const steps: FormulaStep[] = [];

  const capacity = (parent: ParentCalculationInput) => {
    const c = parent.capacity;
    const kgb = c.income.monthlyKgb ?? 0;
    if (kgb > 0 && c.income.kgbVerified === false) warnings.push(`Ouder ${parent.id}: KGB is niet geverifieerd.`);
    const income = round(c.income.monthlyNbi + kgb);
    const norm = calculateCorrectedNorm(c);
    const housing = round(income * 0.30);
    const other = nonNegative(c.otherNecessaryCostsMonthly ?? 0);
    const priority = nonNegative((c.existingChildSupportMonthly ?? 0) + (c.otherPriorityMaintenanceMonthly ?? 0));
    const correction = c.professionalCorrectionMonthly ?? 0;
    const supportable = nonNegative(income - norm - housing - other - priority + correction);
    const percentage = 0.70;
    const result = nonNegative(supportable * percentage);
    return { income, norm, housing, other, priority, correction, supportable, result };
  };

  const payer = capacity(input.payer);
  const recipient = capacity(input.recipient);
  for (const [id, value] of [[input.payer.id, payer], [input.recipient.id, recipient]] as const) {
    steps.push({ key: `capacity.${id}`, formula: "draagkrachtruimte = inkomen − gecorrigeerde bijstandsnorm − woonbudget − andere noodzakelijke lasten − prioritaire verplichtingen", inputs: value, resultMonthly: value.supportable });
    steps.push({ key: `capacity.${id}.result`, formula: "draagkracht = draagkrachtruimte × draagkrachtpercentage", inputs: { percentage: 70 }, resultMonthly: value.result });
  }

  const exceptional = nonNegative((input.need.exceptionalCostsMonthly ?? 0) - (input.need.alreadyIncludedExceptionalCostsMonthly ?? 0));
  const totalNeed = round(input.need.ownShareMonthly + exceptional);
  const maximum = round(Math.min(totalNeed, payer.result));
  let careDiscount = 0;
  if (input.care) {
    careDiscount = input.care.careDiscountOverrideMonthly ?? round((input.care.careDiscountBaseMonthly ?? input.need.ownShareMonthly) * input.care.carePercentage / 100);
    steps.push({ key: "care-discount", formula: "zorgkorting = zorgkortingsgrondslag × zorgkortingspercentage", inputs: { percentage: input.care.carePercentage, base: input.care.careDiscountBaseMonthly ?? input.need.ownShareMonthly }, resultMonthly: careDiscount, note: "Bijzondere/verblijfsoverstijgende kosten worden niet automatisch in de zorgkortingsgrondslag opgenomen." });
  }
  const correction = nonNegative(input.nonVerzilverbareKgbCorrectionMonthly ?? 0);
  const payable = nonNegative(Math.min(maximum, payer.result) - careDiscount - correction);
  steps.push({ key: "maximum", formula: "maximum bijdrage = minimum van eigen aandeel en draagkracht", inputs: { ownShare: totalNeed, capacity: payer.result }, resultMonthly: maximum });
  steps.push({ key: "payable", formula: "te betalen = maximum bijdrage − zorgkorting − expliciete correcties", inputs: { maximum, careDiscount, correction }, resultMonthly: payable });

  return {
    engineVersion: TREMA_2026_ENGINE_VERSION,
    referenceYear: 2026,
    maximumContributionMonthly: maximum,
    payableMonthly: payable,
    payerCapacityMonthly: payer.result,
    recipientCapacityMonthly: recipient.result,
    steps,
    warnings,
    sources: [
      "Rapport Alimentatienormen januari 2026, hoofdstuk 4",
      "Rapport Alimentatienormen januari 2026, hoofdstuk 3",
      "Rapport Alimentatienormen januari 2026, bijlage 5",
      "Artikel 1:397 BW",
      "Artikel 1:404 BW",
    ],
  };
}
