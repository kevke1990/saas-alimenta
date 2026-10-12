import { NORM_VERSION } from "./norms";
import { calculate, type CaseInput } from "./calculator";
import {
  CALCULATION_CONTRACT_VERSION,
  CALCULATION_ENGINE_V2,
  fingerprintCalculation,
  type CalculationFingerprint,
} from "./calculation-engine-v2";
import { buildTremaCaseAudit, type TremaCaseAudit } from "./trema-case-audit";
import { adaptAlimentaForm } from "./alimentatie-engine-adapter";
import { calculateTrema2026 } from "./alimentatie-engine-trema-2026";

export type CalculationEngineV2Result = {
  input: CaseInput;
  result: ReturnType<typeof calculate> & { tremaAudit: TremaCaseAudit };
  fingerprint: CalculationFingerprint;
  ruleEngineVersion: string;
};

/** Stable application boundary for Calculation Engine 2.0. */
export function runCalculationEngineV2(input: CaseInput, normVersion = NORM_VERSION): CalculationEngineV2Result {
  if (!normVersion?.trim()) throw new Error("Een normversie is verplicht voor een berekening.");
  const result = calculate(input);
  const tremaAudit = buildTremaCaseAudit(input, result);
  const resultWithAudit = { ...result, tremaAudit } as any;

  if (tremaAudit.result) {
    resultWithAudit.engineVersion = "2.0.0";
    resultWithAudit.normVersion = "2026.1";
    resultWithAudit.totalCapacity = tremaAudit.result.payerCapacityMonthly + tremaAudit.result.recipientCapacityMonthly + (input.parents[0]?.newPartner?.relationship === "MARRIED" || input.parents[0]?.newPartner?.relationship === "REGISTERED_PARTNERSHIP" ? input.parents[0].newPartner.children?.reduce((sum: number, c: any) => sum + (Number(c.monthlyAmount) || 0), 0) || 0 : 0) + (input.parents[1]?.newPartner?.relationship === "MARRIED" || input.parents[1]?.newPartner?.relationship === "REGISTERED_PARTNERSHIP" ? input.parents[1].newPartner.children?.reduce((sum: number, c: any) => sum + (Number(c.monthlyAmount) || 0), 0) || 0 : 0);

    if (resultWithAudit.parentResults?.[0]) {
      resultWithAudit.parentResults[0].capacity = tremaAudit.result.payerCapacityMonthly;
      resultWithAudit.parentResults[0].stiefchildMaintenance = input.parents[0]?.newPartner?.relationship === "MARRIED" || input.parents[0]?.newPartner?.relationship === "REGISTERED_PARTNERSHIP" ? input.parents[0].newPartner.children?.reduce((sum: number, c: any) => sum + (Number(c.monthlyAmount) || 0), 0) || 0 : 0;
    }
    if (resultWithAudit.parentResults?.[1]) {
      resultWithAudit.parentResults[1].capacity = tremaAudit.result.recipientCapacityMonthly;
      resultWithAudit.parentResults[1].stiefchildMaintenance = input.parents[1]?.newPartner?.relationship === "MARRIED" || input.parents[1]?.newPartner?.relationship === "REGISTERED_PARTNERSHIP" ? input.parents[1].newPartner.children?.reduce((sum: number, c: any) => sum + (Number(c.monthlyAmount) || 0), 0) || 0 : 0;
    }

    const newTransfers = [...(resultWithAudit.transfers || [])];
    if (newTransfers[0]) {
      newTransfers[0] = {
        ...newTransfers[0],
        payment: tremaAudit.result.payableMonthly,
        grossShare: tremaAudit.result.maximumContributionMonthly
      };
    }
    resultWithAudit.transfers = newTransfers;
  }

  const fingerprint = fingerprintCalculation(input, resultWithAudit, normVersion);
  return {
    input,
    result: resultWithAudit,
    fingerprint: { ...fingerprint, engineVersion: CALCULATION_ENGINE_V2, contractVersion: CALCULATION_CONTRACT_VERSION },
    ruleEngineVersion: "1.1.0",
  };
}
