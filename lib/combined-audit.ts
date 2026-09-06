export const COMBINED_AUDIT_VERSION = "0.1.0";

export type CombinedAuditInput = {
  childSupportByParent: number[];
  partnerPayerIndex: number | null;
  partnerMonthlyNet: number;
  partnerMonthlyGross: number;
  partnerCapacityRemainingNet: number;
};

export type CombinedAuditResult = {
  engineVersion: string;
  childSupportPriorityApplied: boolean;
  partnerSupportPresent: boolean;
  partnerPayerIndex: number | null;
  partnerCapacityBeforeChildSupportMonthly: number;
  partnerCapacityAfterChildSupportMonthly: number;
  childSupportForPartnerPayerMonthly: number;
  partnerSupportMonthlyNet: number;
  partnerSupportMonthlyGross: number;
  partnerSupportLimitedByChildPriority: boolean;
  warnings: string[];
};

const money = (value: unknown) => Math.round(Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0) + 1e-9);

/**
 * Creates an auditable combined-support view from the production PAL result.
 *
 * The existing partner engine already subtracts current child support from
 * PAL capacity. This adapter exposes that calculation explicitly without
 * applying the child-support deduction a second time.
 */
export function buildCombinedAudit(input: CombinedAuditInput): CombinedAuditResult {
  const payerIndex = Number.isInteger(input.partnerPayerIndex) ? input.partnerPayerIndex as number : null;
  const childSupport = payerIndex === null ? 0 : money(input.childSupportByParent[payerIndex]);
  const after = money(input.partnerCapacityRemainingNet);
  const before = money(after + childSupport);
  const partnerNet = money(input.partnerMonthlyNet);
  const limited = partnerNet > after;
  const warnings: string[] = [];

  if (payerIndex !== null) {
    warnings.push("Kinderalimentatie is als voorliggende onderhoudsverplichting verwerkt vóór partneralimentatie.");
  }
  if (limited) {
    warnings.push("De resterende draagkracht voor partneralimentatie is begrensd door de reeds verwerkte kinderalimentatie.");
  }

  return {
    engineVersion: COMBINED_AUDIT_VERSION,
    childSupportPriorityApplied: payerIndex !== null,
    partnerSupportPresent: payerIndex !== null,
    partnerPayerIndex: payerIndex,
    partnerCapacityBeforeChildSupportMonthly: before,
    partnerCapacityAfterChildSupportMonthly: after,
    childSupportForPartnerPayerMonthly: childSupport,
    partnerSupportMonthlyNet: partnerNet,
    partnerSupportMonthlyGross: money(input.partnerMonthlyGross),
    partnerSupportLimitedByChildPriority: limited,
    warnings: [...new Set(warnings)],
  };
}
