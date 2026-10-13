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
    resultWithAudit.totalCapacity = tremaAudit.result.payerCapacityMonthly + tremaAudit.result.recipientCapacityMonthly + (tremaAudit.result.stepparentCapacity || 0);

    const stepparentStep = tremaAudit.result.steps.find((s: any) => s.key === "capacity.stepparent");
    const stepparentCap = stepparentStep ? (tremaAudit.result.stepparentCapacity || 0) : 0;

    if (resultWithAudit.parentResults?.[0]) {
      resultWithAudit.parentResults[0].capacity = tremaAudit.result.payerCapacityMonthly;
      resultWithAudit.parentResults[0].stiefchildMaintenance = stepparentStep?.inputs?.partnerId === resultWithAudit.parentResults[0].id ? stepparentCap : 0;
    }
    if (resultWithAudit.parentResults?.[1]) {
      resultWithAudit.parentResults[1].capacity = tremaAudit.result.recipientCapacityMonthly;
      resultWithAudit.parentResults[1].stiefchildMaintenance = stepparentStep?.inputs?.partnerId === resultWithAudit.parentResults[1].id ? stepparentCap : 0;
    }

    // Additional fallback for robust linking based on marital status
    if (resultWithAudit.parentResults) {
       const parentWithPartner = resultWithAudit.parentResults.find((p: any) => p.newPartner?.relationship === "MARRIED");
       if (parentWithPartner && !parentWithPartner.stiefchildMaintenance) {
          parentWithPartner.stiefchildMaintenance = stepparentCap;
       }
    }


    const newTransfers = [...(resultWithAudit.transfers || [])];
    if (newTransfers.length > 0) {
      const totalToDistribute = tremaAudit.result.payableMonthly > 0
        ? tremaAudit.result.payableMonthly
        : Math.max(0, (resultWithAudit.parentResults?.[0]?.capacity || 0) - (resultWithAudit.careDiscountMonthly || 0));

      if (totalToDistribute > 0) {
        const basePerChild = Math.floor(totalToDistribute / newTransfers.length);
        let remainder = totalToDistribute - (basePerChild * newTransfers.length);

        let grossBasePerChild = Math.floor(tremaAudit.result.maximumContributionMonthly / newTransfers.length);
        let grossRemainder = tremaAudit.result.maximumContributionMonthly - (grossBasePerChild * newTransfers.length);

        for (let i = 0; i < newTransfers.length; i++) {
          const childPayment = basePerChild + (remainder > 0 ? 1 : 0);
          if (remainder > 0) remainder--;

          const childGross = grossBasePerChild + (grossRemainder > 0 ? 1 : 0);
          if (grossRemainder > 0) grossRemainder--;

          newTransfers[i] = {
            ...newTransfers[i],
            payment: childPayment,
            grossShare: childGross
          };
        }
      } else {
         // fallback to zero
         for (let i = 0; i < newTransfers.length; i++) {
            newTransfers[i] = {
              ...newTransfers[i],
              payment: 0,
              grossShare: 0
            };
          }
      }
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
