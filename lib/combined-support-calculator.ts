import { calculate, type CaseInput } from "./calculator";
import { calculatePartnerSupport, type PartnerSupportInput, type PartnerSupportResult } from "./partner-calculator";
import { CALCULATION_CONTRACT_VERSION, fingerprintCalculation, type CalculationFingerprint } from "./calculation-engine-v2";

export const COMBINED_SUPPORT_ENGINE_VERSION = "1.0.0";

export type CombinedSupportInput = {
  child: CaseInput;
  partner: Omit<PartnerSupportInput, "payer" | "recipientCurrentNBI" | "payerChildSupportShare"> & {
    payerIndex: 0 | 1;
    recipientIndex?: 0 | 1;
    /** Explicit professional override; otherwise the child engine's cost share is used. */
    payerChildSupportShare?: number;
  };
};

export type CombinedSupportResult = {
  engineVersion: string;
  contractVersion: string;
  fingerprint: CalculationFingerprint;
  childSupport: ReturnType<typeof calculate>;
  partnerSupport: PartnerSupportResult;
  integration: {
    payerIndex: 0 | 1;
    recipientIndex: 0 | 1;
    childCostShare: number;
    childCostShareSource: "CHILD_CALCULATION" | "MANUAL_OVERRIDE";
    childSupportPaymentTotal: number;
  };
};

/**
 * Runs child support first and feeds the payer's calculated share in the
 * children's costs into partner support. A supplied share remains available
 * as an explicit professional override for legacy/custom calculations.
 *
 * The fingerprint covers the complete combined result, so the integrated
 * calculation can be persisted as one reproducible snapshot.
 */
export function calculateCombinedSupport(input: CombinedSupportInput): CombinedSupportResult {
  const childSupport = calculate(input.child);
  const payerIndex = input.partner.payerIndex;
  const recipientIndex = input.partner.recipientIndex ?? (payerIndex === 0 ? 1 : 0);

  const payerParent = input.child.parents[payerIndex];
  const recipientParent = input.child.parents[recipientIndex];
  if (!payerParent || !recipientParent) throw new Error("Ongeldige ouderindex voor partneralimentatie.");

  const calculatedChildCostShare = Number(childSupport.parentResults[payerIndex]?.allocatedNeed ?? 0);
  const manualOverride = input.partner.payerChildSupportShare;
  const hasManualOverride = manualOverride !== undefined;
  const childCostShare = hasManualOverride ? Math.max(0, Number(manualOverride) || 0) : calculatedChildCostShare;

  const payerNBI = Number(childSupport.parentResults[payerIndex]?.nbi ?? payerParent.nbi);
  const recipientNBI = Number(childSupport.parentResults[recipientIndex]?.nbi ?? recipientParent.nbi);

  const partnerSupport = calculatePartnerSupport({
    ...input.partner,
    payer: { ...payerParent, nbi: payerNBI },
    recipientCurrentNBI: recipientNBI,
    payerChildSupportShare: childCostShare,
  });

  const resultWithoutFingerprint = {
    engineVersion: COMBINED_SUPPORT_ENGINE_VERSION,
    contractVersion: CALCULATION_CONTRACT_VERSION,
    childSupport,
    partnerSupport,
    integration: {
      payerIndex,
      recipientIndex,
      childCostShare: Math.round(childCostShare),
      childCostShareSource: hasManualOverride ? "MANUAL_OVERRIDE" as const : "CHILD_CALCULATION" as const,
      childSupportPaymentTotal: Math.round(childSupport.parentResults[payerIndex]?.paymentTotal ?? 0),
    },
  };

  const fingerprint = fingerprintCalculation(input, resultWithoutFingerprint, partnerSupport.normVersion);
  return { ...resultWithoutFingerprint, fingerprint };
}
