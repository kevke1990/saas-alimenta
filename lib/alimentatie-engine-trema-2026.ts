/**
 * Auditable Trema/Alimentatienormen 2026 calculation core.
 *
 * Important: the Trema report contains recommendations and year/half-year
 * dependent tables. This core therefore never invents missing table values.
 * The UI must provide the applicable official table result or explicitly use
 * the published formula path for incomes for which that path applies.
 */

export type ParentId = "A" | "B";
export type Household = "single" | "married" | "pension";
export type CapacityMethod = "official-table" | "published-formula";

export interface IncomeInput {
  /** Net disposable income before KGB, monthly. */
  monthlyNbi: number;
  /** KGB is added only for the child-support calculation. */
  monthlyKgb?: number;
  kgbVerified?: boolean;
  referenceYear: number;
}

export interface CapacityInput {
  income: IncomeInput;
  household: Household;
  aowEligible?: boolean;
  /** Use an official table result for the applicable income band. */
  officialCapacityMonthly?: number;
  capacityMethod?: CapacityMethod;
  /** Required for the published formula path. */
  correctedAssistanceNormMonthly?: number;
  /** Housing budget is normally 30% of NBI; may be supplied explicitly. */
  housingBudgetMonthly?: number;
  otherNecessaryCostsMonthly?: number;
  existingChildSupportMonthly?: number;
  otherPriorityMaintenanceMonthly?: number;
  /** Only use after documented professional review. */
  professionalCorrectionMonthly?: number;
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
  inputs: Record<string, unknown>;
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

export const TREMA_2026_ENGINE_VERSION = "3.1.0-trema-2026-auditable";

const round = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
const nonNegative = (value: number): number => Math.max(0, round(value));
const assertFinite = (name: string, value: number): void => {
  if (!Number.isFinite(value)) throw new Error(`${name} moet een eindig getal zijn.`);
};

/**
 * Published 2026 correction formula:
 * assistance norm - housing component + health premium - norm premium
 * + unforeseen costs, rounded to €5. The AOW floor is applied according to
 * the January 2026 example. Inputs must come from the applicable official
 * period, not from user-entered guesses.
 */
export function correctedAssistanceNorm2026(input: {
  assistanceNormMonthly: number;
  housingComponentMonthly: number;
  healthPremiumMonthly: number;
  healthNormPremiumMonthly: number;
  unforeseenCostsMonthly: number;
  aowEligible?: boolean;
}): number {
  for (const [name, value] of Object.entries(input)) {
    if (name !== "aowEligible") assertFinite(name, value as number);
  }
  const raw = input.assistanceNormMonthly - input.housingComponentMonthly
    + input.healthPremiumMonthly - input.healthNormPremiumMonthly
    + input.unforeseenCostsMonthly;
  const rounded = Math.round(raw / 5) * 5;
  return input.aowEligible ? Math.max(rounded, 1525) : rounded;
}

export function calculateCorrectedNorm(capacity: CapacityInput): number {
  if (capacity.correctedAssistanceNormMonthly !== undefined) {
    assertFinite("correctedAssistanceNormMonthly", capacity.correctedAssistanceNormMonthly);
    return nonNegative(capacity.correctedAssistanceNormMonthly);
  }
  throw new Error(
    "Ontbrekende gecorrigeerde bijstandsnorm. Lever de officiële toepasselijke 2026-waarde aan; de engine vult deze niet automatisch in."
  );
}

function calculateCapacity(parent: ParentCalculationInput, warnings: string[], steps: FormulaStep) {
  const c = parent.capacity;
  const nbi = c.income.monthlyNbi;
  const kgb = c.income.monthlyKgb ?? 0;
  assertFinite(`ouder ${parent.id}: monthlyNbi`, nbi);
  assertFinite(`ouder ${parent.id}: monthlyKgb`, kgb);
  if (nbi < 0 || kgb < 0) throw new Error(`Ouder ${parent.id}: inkomen en KGB mogen niet negatief zijn.`);
  if (kgb > 0 && c.income.kgbVerified === false) warnings.push(`Ouder ${parent.id}: KGB is niet als geverifieerd gemarkeerd.`);

  const incomeForChildSupport = round(nbi + kgb);
  const norm = calculateCorrectedNorm(c);
  const housing = c.housingBudgetMonthly === undefined ? round(nbi * 0.3) : nonNegative(c.housingBudgetMonthly);
  const other = nonNegative(c.otherNecessaryCostsMonthly ?? 0);
  const priority = nonNegative((c.existingChildSupportMonthly ?? 0) + (c.otherPriorityMaintenanceMonthly ?? 0));
  const correction = c.professionalCorrectionMonthly ?? 0;
  assertFinite(`ouder ${parent.id}: professionalCorrectionMonthly`, correction);

  const room = nonNegative(incomeForChildSupport - norm - housing - other - priority + correction);
  let capacity: number;
  if (c.capacityMethod === "official-table") {
    if (c.officialCapacityMonthly === undefined) throw new Error(`Ouder ${parent.id}: officiële draagkracht uit de toepasselijke tabel ontbreekt.`);
    assertFinite(`ouder ${parent.id}: officialCapacityMonthly`, c.officialCapacityMonthly);
    capacity = nonNegative(c.officialCapacityMonthly);
  } else {
    capacity = nonNegative(room * 0.7);
    if (c.capacityMethod !== "published-formula") warnings.push(`Ouder ${parent.id}: draagkrachtpercentage 70% gebruikt als expliciete formule-default; controleer of de officiële tabel van toepassing is.`);
  }

  steps.inputs = { nbi, kgb, incomeForChildSupport, norm, housing, other, priority, correction, room, capacityMethod: c.capacityMethod ?? "published-formula" };
  steps.resultMonthly = room;
  return { capacity, room, incomeForChildSupport, norm, housing, other, priority, correction };
}

export function calculateTrema2026(input: Trema2026Input): Trema2026Result {
  if (input.referenceYear !== 2026) throw new Error("Deze enginecore is uitsluitend bedoeld voor peiljaar 2026.");
  const warnings: string[] = [];
  const steps: FormulaStep[] = [];

  const payerStep: FormulaStep = {
    key: `capacity.${input.payer.id}`,
    formula: "draagkrachtruimte = NBI + KGB − gecorrigeerde bijstandsnorm − woonbudget − andere noodzakelijke lasten − prioritaire verplichtingen + gedocumenteerde correctie",
    inputs: {},
  };
  const recipientStep: FormulaStep = {
    key: `capacity.${input.recipient.id}`,
    formula: "draagkrachtruimte = NBI + KGB − gecorrigeerde bijstandsnorm − woonbudget − andere noodzakelijke lasten − prioritaire verplichtingen + gedocumenteerde correctie",
    inputs: {},
  };
  const payer = calculateCapacity(input.payer, warnings, payerStep);
  const recipient = calculateCapacity(input.recipient, warnings, recipientStep);
  steps.push(payerStep, recipientStep);

  const ownShare = nonNegative(input.need.ownShareMonthly);
  const exceptional = nonNegative((input.need.exceptionalCostsMonthly ?? 0) - (input.need.alreadyIncludedExceptionalCostsMonthly ?? 0));
  const totalNeed = round(ownShare + exceptional);
  const maximum = round(Math.min(totalNeed, payer.capacity));

  let careDiscount = 0;
  if (input.care) {
    if (input.care.carePercentage < 0 || input.care.carePercentage > 100) throw new Error("Zorgkortingspercentage moet tussen 0 en 100 liggen.");
    const base = input.care.careDiscountBaseMonthly ?? ownShare;
    careDiscount = input.care.careDiscountOverrideMonthly ?? round(base * input.care.carePercentage / 100);
    careDiscount = nonNegative(careDiscount);
    steps.push({ key: "care-discount", formula: "zorgkorting = zorgkortingsgrondslag × zorgkortingspercentage", inputs: { base, percentage: input.care.carePercentage }, resultMonthly: careDiscount });
  }

  const kgbCorrection = nonNegative(input.nonVerzilverbareKgbCorrectionMonthly ?? 0);
  const payable = nonNegative(maximum - careDiscount - kgbCorrection);
  steps.push(
    { key: "maximum", formula: "maximum bijdrage = minimum van behoefte en draagkracht", inputs: { need: totalNeed, payerCapacity: payer.capacity }, resultMonthly: maximum },
    { key: "payable", formula: "te betalen = maximum bijdrage − zorgkorting − expliciete niet-verzilverbare-KGB-correctie", inputs: { maximum, careDiscount, kgbCorrection }, resultMonthly: payable },
  );

  return {
    engineVersion: TREMA_2026_ENGINE_VERSION,
    referenceYear: 2026,
    maximumContributionMonthly: maximum,
    payableMonthly: payable,
    payerCapacityMonthly: payer.capacity,
    recipientCapacityMonthly: recipient.capacity,
    steps,
    warnings,
    sources: [
      "Rapport Alimentatienormen januari 2026, hoofdstuk 3 (behoefte)",
      "Rapport Alimentatienormen januari 2026, hoofdstuk 4 (draagkracht)",
      "Rapport Alimentatienormen januari 2026, bijlage 5 (draagkrachttabel/formules)",
      "Artikel 1:397 BW",
      "Artikel 1:404 BW",
    ],
  };
}
