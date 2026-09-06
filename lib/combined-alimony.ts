import type { PartnerAlimonyResult } from "./partner-alimony-engine";

export const COMBINED_ALIMONY_ENGINE_VERSION = "0.1.0";

type ChildSupportSummary = {
  payerIndex: number;
  paymentMonthly: number;
};

export type CombinedAlimonyInput = {
  childSupport: ChildSupportSummary[];
  partnerSupport?: PartnerAlimonyResult | null;
  partnerPayerIndex?: number;
};

export type CombinedAlimonyResult = {
  engineVersion: string;
  childSupportMonthly: number;
  partnerSupportMonthly: number;
  totalMonthly: number;
  partnerCapacityBeforeChildSupportMonthly: number;
  partnerCapacityAfterChildSupportMonthly: number;
  partnerSupportLimitedByChildPriority: boolean;
  warnings: string[];
  audit: {
    childSupportPriorityApplied: boolean;
    partnerSupportPresent: boolean;
  };
};

const money = (value: unknown) => Math.round(Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0) + 1e-9);

/**
 * Combines child and partner support without allowing partner support to
 * consume capacity that is already required for child support.
 *
 * The module deliberately does not decide legal entitlement, duration or
 * exceptions. It combines already-reviewed engine outputs and makes the
 * priority calculation explicit and auditable.
 */
export function combineAlimonyResults(input: CombinedAlimonyInput): CombinedAlimonyResult {
  const childSupportMonthly = money(input.childSupport.reduce((sum, item) => sum + money(item.paymentMonthly), 0));
  const partner = input.partnerSupport ?? null;
  const before = money(partner?.payerCapacityMonthly ?? 0);
  const after = money(Math.max(0, before - childSupportMonthly));

  let partnerSupportMonthly = 0;
  let limited = false;
  const warnings: string[] = [];

  if (partner) {
    const requested = money(partner.contributionMonthly);
    partnerSupportMonthly = Math.min(requested, after, money(partner.calculatedNeedMonthly));
    limited = partnerSupportMonthly < requested;
    warnings.push("Kinderalimentatie is als voorliggende onderhoudsverplichting vóór partneralimentatie toegepast.");
    if (limited) {
      warnings.push("De beschikbare draagkracht voor partneralimentatie is verminderd met de vastgestelde kinderalimentatiebijdrage.");
    }
    warnings.push(...partner.warnings);
  }

  return {
    engineVersion: COMBINED_ALIMONY_ENGINE_VERSION,
    childSupportMonthly,
    partnerSupportMonthly: money(partnerSupportMonthly),
    totalMonthly: money(childSupportMonthly + partnerSupportMonthly),
    partnerCapacityBeforeChildSupportMonthly: before,
    partnerCapacityAfterChildSupportMonthly: after,
    partnerSupportLimitedByChildPriority: limited,
    warnings: [...new Set(warnings)],
    audit: {
      childSupportPriorityApplied: !!partner,
      partnerSupportPresent: !!partner,
    },
  };
}
