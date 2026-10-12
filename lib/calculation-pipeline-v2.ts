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

    if (resultWithAudit.parentResults?.[0]) {
      resultWithAudit.parentResults[0].capacity = tremaAudit.result.payerCapacityMonthly;
      resultWithAudit.parentResults[0].stiefchildMaintenance = "A" === tremaAudit.result.steps.find(s => s.key === "capacity.stepparent")?.inputs?.partnerId ? tremaAudit.result.stepparentCapacity : 0;
    }
    if (resultWithAudit.parentResults?.[1]) {
      resultWithAudit.parentResults[1].capacity = tremaAudit.result.recipientCapacityMonthly;
      resultWithAudit.parentResults[1].stiefchildMaintenance = "B" === tremaAudit.result.steps.find(s => s.key === "capacity.stepparent")?.inputs?.partnerId ? tremaAudit.result.stepparentCapacity : 0;
    }

    const newTransfers = [...(resultWithAudit.transfers || [])];
    if (newTransfers.length > 0) {
      let remainingPayment = tremaAudit.result.payableMonthly;
      let remainingGross = tremaAudit.result.maximumContributionMonthly;

      const payments = newTransfers.map(() => Math.round(tremaAudit.result!.payableMonthly / newTransfers.length));
      const grosses = newTransfers.map(() => Math.round(tremaAudit.result!.maximumContributionMonthly / newTransfers.length));

      // Fix rounding errors
      let paymentSum = payments.reduce((a, b) => a + b, 0);
      let grossSum = grosses.reduce((a, b) => a + b, 0);

      if (paymentSum !== tremaAudit.result.payableMonthly && payments.length > 0) {
          payments[0] += tremaAudit.result.payableMonthly - paymentSum;
      }
      if (grossSum !== tremaAudit.result.maximumContributionMonthly && grosses.length > 0) {
          grosses[0] += tremaAudit.result.maximumContributionMonthly - grossSum;
      }

      for (let i = 0; i < newTransfers.length; i++) {
        newTransfers[i] = {
          ...newTransfers[i],
          payment: payments[i],
          grossShare: grosses[i]
        };
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
