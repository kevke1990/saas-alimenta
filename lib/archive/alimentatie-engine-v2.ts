/**
 * Transparent, deterministic child-support calculation core.
 *
 * This module deliberately separates:
 * - factual input;
 * - normative assumptions;
 * - calculated values;
 * - legal/source metadata;
 * - warnings and professional review points.
 *
 * It does not make an autonomous legal decision about KGB entitlement.
 */

export type ParentId = "A" | "B";
export type KgbStatus = "received" | "calculated" | "not_received" | "unknown";
export type EligibilityStatus = "eligible" | "not_eligible" | "unknown";

export interface ChildInput {
  id: string;
  age: number;
  specialCostsMonthly?: number;
}

export interface KgbInput {
  status: KgbStatus;
  monthlyAmount?: number;
  childUnder18?: boolean;
  responsibleForChild?: boolean;
  qualifyingResidence?: boolean;
  incomeWithinLimit?: boolean;
  assetsWithinLimit?: boolean;
  partnerSituationKnown?: boolean;
  referenceYear: number;
  evidenceNote?: string;
}

export interface ParentInput {
  id: ParentId;
  name?: string;
  netDisposableIncomeMonthly: number;
  kgb?: KgbInput;
  existingChildSupportMonthly?: number;
  otherMaintenanceObligationsMonthly?: number;
  partnerChildrenCount?: number;
  partnerIncomeRelevant?: boolean;
  professionalCorrectionMonthly?: number;
}

export interface CareInput {
  averageCareDaysPerWeek: number;
  careDiscountOverridePercent?: number;
}

export interface CalculationInput {
  referenceYear: number;
  children: ChildInput[];
  parentA: ParentInput;
  parentB: ParentInput;
  totalChildNeedMonthly: number;
  careParentId: ParentId;
  care: CareInput;
  nonVerzilverbareKgbCorrectionMonthly?: number;
}

export interface SourceReference {
  id: string;
  title: string;
  kind: "law" | "case_law" | "guideline" | "government" | "table";
  note: string;
}

export interface KgbAssessment {
  status: EligibilityStatus;
  amountIncludedMonthly: number;
  missingChecks: string[];
  failedChecks: string[];
  warnings: string[];
}

export interface CalculationResult {
  engineVersion: string;
  referenceYear: number;
  summary: {
    totalNeedMonthly: number;
    totalCapacityMonthly: number;
    parentAShareMonthly: number;
    parentBShareMonthly: number;
    careDiscountMonthly: number;
    finalPayableMonthly: number;
  };
  details: Record<string, unknown>;
  kgb: Record<ParentId, KgbAssessment>;
  warnings: string[];
  sources: SourceReference[];
}

export const ENGINE_VERSION = "2.0.0";

export const SOURCES: SourceReference[] = [
  { id: "BW_1_397", title: "Artikel 1:397 BW", kind: "law", note: "Behoefte en draagkracht vormen het uitgangspunt." },
  { id: "BW_1_404", title: "Artikel 1:404 BW", kind: "law", note: "Ouders dragen naar draagkracht bij aan verzorging en opvoeding." },
  { id: "WKB_ART_2_6", title: "Wet op het kindgebonden budget, artikel 2 lid 6", kind: "law", note: "Juridisch kader voor het kindgebonden budget; toepasselijkheid moet per peiljaar worden gecontroleerd." },
  { id: "ECLI_NL_HR_2015_3011", title: "ECLI:NL:HR:2015:3011", kind: "case_law", note: "Jurisprudentiële bron; de feiten en rechtsregel moeten professioneel worden getoetst voordat een afwijking wordt toegepast." },
  { id: "RECHTSPRAAK_BEHOEFTETABEL", title: "Behoeftetabel Rechtspraak", kind: "table", note: "Gebruik de tabel die hoort bij het gekozen peiljaar; bijzondere kosten worden afzonderlijk vastgelegd." },
  { id: "RECHTSPRAAK_DRAAGKRACHTTABEL", title: "Draagkrachttabel Rechtspraak", kind: "table", note: "Gebruik de tabel die hoort bij het gekozen peiljaar en leg de gebruikte band/formule vast." },
  { id: "RAPPORT_ZORGKORTING", title: "Rapport Alimentatienormen — zorgkorting", kind: "guideline", note: "Zorgkorting wordt berekend over het eigen aandeel in de kosten, niet over bijzondere/verblijfsoverstijgende kosten." },
  { id: "RAPPORT_VERBLIJFSOVERSTIJGEND", title: "Rapport Alimentatienormen — verblijfsoverstijgende kosten", kind: "guideline", note: "Deze kosten worden apart geregistreerd en niet stilzwijgend in de zorgkorting verwerkt." },
  { id: "DIENST_TOESLAGEN_KGB", title: "Dienst Toeslagen — voorwaarden kindgebonden budget", kind: "government", note: "De engine beoordeelt alleen ingevulde voorwaarden; jaargebonden inkomens- en vermogensgrenzen moeten actueel worden aangeleverd." },
];

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function careDiscountPercent(daysPerWeek: number): number {
  if (daysPerWeek < 1) return 5;
  if (daysPerWeek < 2) return 15;
  if (daysPerWeek < 3) return 25;
  return 35;
}

export function assessKgb(input?: KgbInput): KgbAssessment {
  if (!input || input.status === "unknown") {
    return { status: "unknown", amountIncludedMonthly: 0, missingChecks: ["KGB-status en onderbouwing"], failedChecks: [], warnings: ["KGB is niet vastgesteld en is daarom niet in het NBI opgenomen."] };
  }

  const checks: Array<[string, boolean | undefined]> = [
    ["kind jonger dan 18 jaar", input.childUnder18],
    ["verantwoordelijkheid voor het kind", input.responsibleForChild],
    ["kwalificerende woon-/verblijfsstatus", input.qualifyingResidence],
    ["inkomensgrens", input.incomeWithinLimit],
    ["vermogensgrens", input.assetsWithinLimit],
    ["partner-/gezinspositie", input.partnerSituationKnown],
  ];
  const missingChecks = checks.filter(([, value]) => value === undefined).map(([label]) => label);
  const failedChecks = checks.filter(([, value]) => value === false).map(([label]) => label);
  const status: EligibilityStatus = failedChecks.length ? "not_eligible" : missingChecks.length ? "unknown" : "eligible";
  const amount = status === "not_eligible" || input.status === "not_received" ? 0 : money(input.monthlyAmount ?? 0);
  const warnings: string[] = [];
  if (status === "unknown") warnings.push("Niet alle voorwaarden van Dienst Toeslagen zijn gecontroleerd.");
  if (input.status === "calculated" && !input.evidenceNote) warnings.push("Het berekende KGB heeft nog geen onderbouwing/evidence note.");
  return { status, amountIncludedMonthly: amount, missingChecks, failedChecks, warnings };
}

export function calculateChildSupport(input: CalculationInput): CalculationResult {
  const kgbA = assessKgb(input.parentA.kgb);
  const kgbB = assessKgb(input.parentB.kgb);
  const nbiA = money(input.parentA.netDisposableIncomeMonthly + kgbA.amountIncludedMonthly);
  const nbiB = money(input.parentB.netDisposableIncomeMonthly + kgbB.amountIncludedMonthly);
  const totalCapacity = Math.max(0, money(nbiA + nbiB - (input.parentA.existingChildSupportMonthly ?? 0) - (input.parentB.existingChildSupportMonthly ?? 0) - (input.parentA.otherMaintenanceObligationsMonthly ?? 0) - (input.parentB.otherMaintenanceObligationsMonthly ?? 0)));
  const ratioA = nbiA + nbiB > 0 ? nbiA / (nbiA + nbiB) : 0.5;
  const ratioB = 1 - ratioA;
  const allocatedA = money(input.totalChildNeedMonthly * ratioA);
  const allocatedB = money(input.totalChildNeedMonthly * ratioB);
  const carePercent = input.care.careDiscountOverridePercent ?? careDiscountPercent(input.care.averageCareDaysPerWeek);
  const careBase = input.careParentId === "A" ? allocatedB : allocatedA;
  const careDiscount = money(careBase * carePercent / 100);
  const payerShare = input.careParentId === "A" ? allocatedB : allocatedA;
  const finalPayable = Math.max(0, money(Math.min(payerShare, totalCapacity) - careDiscount - (input.nonVerzilverbareKgbCorrectionMonthly ?? 0)));
  const warnings = [
    ...(kgbA.warnings.map((warning) => `Ouder A: ${warning}`)),
    ...(kgbB.warnings.map((warning) => `Ouder B: ${warning}`)),
    ...(input.care.careDiscountOverridePercent !== undefined ? ["Professionele override voor zorgkorting toegepast."] : []),
    ...(input.nonVerzilverbareKgbCorrectionMonthly ? ["Correctie voor niet-verzilverbaar KGB toegepast."] : []),
  ];
  return {
    engineVersion: ENGINE_VERSION,
    referenceYear: input.referenceYear,
    summary: {
      totalNeedMonthly: money(input.totalChildNeedMonthly),
      totalCapacityMonthly: totalCapacity,
      parentAShareMonthly: allocatedA,
      parentBShareMonthly: allocatedB,
      careDiscountMonthly: careDiscount,
      finalPayableMonthly: finalPayable,
    },
    details: {
      children: input.children,
      nbi: { parentA: nbiA, parentB: nbiB },
      kgbIncluded: { parentA: kgbA.amountIncludedMonthly, parentB: kgbB.amountIncludedMonthly },
      capacityInputs: { parentA: input.parentA, parentB: input.parentB },
      allocationRatios: { parentA: ratioA, parentB: ratioB },
      care: { daysPerWeek: input.care.averageCareDaysPerWeek, percentage: carePercent, base: careBase },
      nonVerzilverbareKgbCorrectionMonthly: input.nonVerzilverbareKgbCorrectionMonthly ?? 0,
      formulas: [
        "NBI = netto besteedbaar inkomen + vastgesteld KGB",
        "Aandeel = behoefte × NBI ouder / gezamenlijk NBI",
        "Zorgkorting = eigen aandeel × zorgkortingspercentage",
        "Eindbedrag = draagkrachtbegrensd aandeel − zorgkorting − expliciete correcties",
      ],
    },
    kgb: { A: kgbA, B: kgbB },
    warnings,
    sources: SOURCES,
  };
}
