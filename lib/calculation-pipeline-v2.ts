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

    // 1. Identificeer dynamisch welke ouder de betaler (payer) en welke de ontvanger (recipient) is
    let payerIndex = -1;
    let recipientIndex = -1;

    if (resultWithAudit.transfers && resultWithAudit.transfers.length > 0) {
      payerIndex = resultWithAudit.transfers[0].payerIndex ?? (resultWithAudit.transfers[0].direction === 'B->A' ? 1 : 0);
      recipientIndex = payerIndex === 0 ? 1 : 0;
    } else if (resultWithAudit.parentResults && resultWithAudit.parentResults.length >= 2) {
      // Fallback op basis van rollen of wie kinderalimentatie verschuldigd is
      payerIndex = resultWithAudit.parentResults.findIndex((p: any) => p.isRecipient === false || p.role === 'payer' || p.role === 'B');
      if (payerIndex === -1) {
        payerIndex = resultWithAudit.parentResults[1].capacity > resultWithAudit.parentResults[0].capacity ? 1 : 0;
      }
      recipientIndex = payerIndex === 0 ? 1 : 0;
    } else {
      payerIndex = 1;
      recipientIndex = 0;
    }

    const payerCap = tremaAudit?.result?.payerCapacityMonthly ?? 0;
    const recipientCap = tremaAudit?.result?.recipientCapacityMonthly ?? 0;
    const stepparentCap = tremaAudit?.result?.stepparentCapacity ?? 0;
    const totalPayable = tremaAudit?.result?.payableMonthly ?? 0;

    // 2. Wijs capaciteit en betaling toe aan de JUISTE ouder in parentResults
    if (resultWithAudit.parentResults?.[payerIndex]) {
      resultWithAudit.parentResults[payerIndex].capacity = payerCap;
      resultWithAudit.parentResults[payerIndex].paymentTotal = totalPayable;
      resultWithAudit.parentResults[payerIndex].childAlimonyPayment = totalPayable;
    }

    if (resultWithAudit.parentResults?.[recipientIndex]) {
      resultWithAudit.parentResults[recipientIndex].capacity = recipientCap;
      resultWithAudit.parentResults[recipientIndex].paymentTotal = 0;
    }

    // 3. Koppel de stiefouder aan de ouder die gehuwd/geregistreerd partner is
    const marriedParentIdx = (input.parents || []).findIndex(
      (p: any) => p.newPartner?.present && (p.newPartner.relationship === 'MARRIED' || p.newPartner.relatievorm === 'MARRIED' || p.newPartner.relationship === 'REGISTERED_PARTNERSHIP')
    );

    if (marriedParentIdx !== -1 && stepparentCap > 0 && resultWithAudit.parentResults?.[marriedParentIdx]) {
      resultWithAudit.parentResults[marriedParentIdx].stiefchildMaintenance = stepparentCap;
    }

    // 4. Update de gezamenlijke draagkracht en tekort op het root-resultaat
    const combinedCap = payerCap + recipientCap + stepparentCap;
    resultWithAudit.totalCapacity = combinedCap > 0 ? combinedCap : resultWithAudit.totalCapacity;
    resultWithAudit.capacityDeficit = Math.max(0, (resultWithAudit.totalNeed || 0) - resultWithAudit.totalCapacity);
    resultWithAudit.capacitySufficient = resultWithAudit.totalCapacity >= (resultWithAudit.totalNeed || 0);


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
