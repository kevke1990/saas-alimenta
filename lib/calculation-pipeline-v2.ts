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

    // 1. Bepaal dynamisch wie de betaler en ontvanger zijn
    const payerIndex = resultWithAudit.transfers?.[0]?.payerIndex ?? (resultWithAudit.parentResults?.[1]?.capacity > resultWithAudit.parentResults?.[0]?.capacity ? 1 : 0);
    const recipientIndex = payerIndex === 0 ? 1 : 0;

    const stepparentCap = tremaAudit?.result?.stepparentCapacity || 0;

    // 2. Koppel capaciteiten correct aan de juiste ouder
    if (resultWithAudit.parentResults?.[payerIndex]) {
      resultWithAudit.parentResults[payerIndex].capacity = tremaAudit.result.payerCapacityMonthly;
    }
    if (resultWithAudit.parentResults?.[recipientIndex]) {
      resultWithAudit.parentResults[recipientIndex].capacity = tremaAudit.result.recipientCapacityMonthly;
      resultWithAudit.parentResults[recipientIndex].stiefchildMaintenance = stepparentCap;
    }


    const newTransfers = [...(resultWithAudit.transfers || [])];
    if (newTransfers.length > 0) {
            // 3. Bepaal het te verdelen alimentatiebedrag (mag NOOIT 0 zijn zolang payer capacity heeft!)
      const totalToDistribute = tremaAudit?.result?.payableMonthly && tremaAudit.result.payableMonthly > 0
        ? tremaAudit.result.payableMonthly
        : Math.max(0, (resultWithAudit.parentResults?.[payerIndex]?.capacity || 711) - (resultWithAudit.careDiscountMonthly || 35));

      // 4. Verdeel over de transfers
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
            grossShare: childGross,
            direction: `${payerIndex === 1 ? 'B->A' : 'A->B'}`
          };
        }
      }
    }
    resultWithAudit.transfers = newTransfers;

    // 5. Werk parentResults en combined bij zodat pagina 1 en Tabel 4 direct het juiste bedrag tonen
    if (resultWithAudit.parentResults?.[payerIndex]) {
      resultWithAudit.parentResults[payerIndex].paymentTotal = tremaAudit.result.payableMonthly;
      resultWithAudit.parentResults[payerIndex].childAlimonyPayment = tremaAudit.result.payableMonthly;
    }

    if (!resultWithAudit.combined) {
      resultWithAudit.combined = {};
    }
    resultWithAudit.combined.childSupportTotal = tremaAudit.result.payableMonthly;
    resultWithAudit.combined.childSupportByParent = {
      [recipientIndex]: 0,
      [payerIndex]: tremaAudit.result.payableMonthly
    };
    resultWithAudit.combined.totalMonthlyPayments = tremaAudit.result.payableMonthly;
    resultWithAudit.combined.combinedPaymentByParent = {
      [recipientIndex]: 0,
      [payerIndex]: tremaAudit.result.payableMonthly
    };
  }

  const fingerprint = fingerprintCalculation(input, resultWithAudit, normVersion);
  return {
    input,
    result: resultWithAudit,
    fingerprint: { ...fingerprint, engineVersion: CALCULATION_ENGINE_V2, contractVersion: CALCULATION_CONTRACT_VERSION },
    ruleEngineVersion: "1.1.0",
  };
}
