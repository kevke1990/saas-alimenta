import { calculatePartnerSupportCapacity, type SupportCapacityInput } from "./support-engine";

export const PARTNER_ENGINE_VERSION = "0.1.1";

export type PartnerAlimonyInput = {
  /** Professionally determined monthly need before the recipient's own NBI. */
  needBasisMonthly: number;
  recipientNbiMonthly: number;
  payer: SupportCapacityInput;
  /** Optional professional override of the resulting monthly contribution. */
  contributionOverrideMonthly?: number;
};

export type PartnerAlimonyResult = {
  engineVersion: string;
  needBasisMonthly: number;
  recipientNbiMonthly: number;
  calculatedNeedMonthly: number;
  payerCapacityMonthly: number;
  contributionMonthly: number;
  unmetNeedMonthly: number;
  capacityRemainingMonthly: number;
  capacityMethod: string;
  warnings: string[];
  audit: {
    recipientOwnIncomeUsed: boolean;
    payerCapacityIncludesKgb: boolean;
    overrideApplied: boolean;
    requestedOverrideMonthly: number;
    calculatedContributionBeforeOverrideMonthly: number;
  };
};

const nonNegative = (value: unknown) => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
const signed = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = (value: number) => Math.round(Math.max(0, value) + 1e-9);

/**
 * Transparent partner-alimony calculation foundation.
 *
 * The professional supplies the monthly need basis. The engine does not invent
 * a marital-standard figure or silently apply legal exceptions. The recipient's
 * own NBI reduces the calculated need; the payer's capacity is then determined
 * by the shared support-capacity engine.
 */
export function calculatePartnerAlimony(input: PartnerAlimonyInput): PartnerAlimonyResult {
  const needBasis = nonNegative(input.needBasisMonthly);
  const recipientNbi = nonNegative(input.recipientNbiMonthly);
  const calculatedNeed = money(Math.max(0, needBasis - recipientNbi));
  const payerCapacity = calculatePartnerSupportCapacity({
    ...input.payer,
    kgb: undefined,
  });

  const calculatedContributionBeforeOverride = money(Math.min(calculatedNeed, payerCapacity.capacity));
  const override = signed(input.contributionOverrideMonthly);
  const overrideApplied = override > 0;
  const uncappedContribution = overrideApplied ? override : calculatedContributionBeforeOverride;
  const contribution = money(Math.min(calculatedNeed, Math.min(payerCapacity.capacity, uncappedContribution)));

  const warnings = [
    "De behoeftegrondslag voor partneralimentatie is professioneel vastgesteld en wordt niet automatisch door de engine bepaald.",
    "Controleer behoefte/behoeftigheid, limitering, nieuwe partner, woonlasten en overige onderhoudsverplichtingen afzonderlijk.",
    ...payerCapacity.notes,
  ];
  if (overrideApplied) warnings.push("Een professionele bijdrage-override is toegepast; de oorspronkelijke berekende bijdrage blijft auditbaar via de resultaatgegevens.");
  if (input.payer.kgb) warnings.push("KGB is niet meegenomen in de draagkracht voor partneralimentatie.");
  if (calculatedNeed > payerCapacity.capacity) warnings.push("De berekende behoefte is hoger dan de draagkracht van de onderhoudsplichtige; het resterende deel is onvervuld.");
  if (overrideApplied && override !== contribution) warnings.push("De professionele override is begrensd door behoefte en/of beschikbare draagkracht.");

  return {
    engineVersion: PARTNER_ENGINE_VERSION,
    needBasisMonthly: money(needBasis),
    recipientNbiMonthly: money(recipientNbi),
    calculatedNeedMonthly: calculatedNeed,
    payerCapacityMonthly: money(payerCapacity.capacity),
    contributionMonthly: contribution,
    unmetNeedMonthly: money(Math.max(0, calculatedNeed - contribution)),
    capacityRemainingMonthly: money(Math.max(0, payerCapacity.capacity - contribution)),
    capacityMethod: payerCapacity.method,
    warnings,
    audit: {
      recipientOwnIncomeUsed: recipientNbi > 0,
      payerCapacityIncludesKgb: false,
      overrideApplied,
      requestedOverrideMonthly: money(override),
      calculatedContributionBeforeOverrideMonthly: calculatedContributionBeforeOverride,
    },
  };
}
