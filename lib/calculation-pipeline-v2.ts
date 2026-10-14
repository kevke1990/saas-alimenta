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

    const transferDir = resultWithAudit.transfers?.[0]?.direction;
    if (transferDir) {
      payerIndex = transferDir === 'B->A' ? 1 : transferDir === 'A->B' ? 0 : 1;
    } else if (resultWithAudit.transfers && resultWithAudit.transfers.length > 0) {
      payerIndex = resultWithAudit.transfers[0].payerIndex ?? (resultWithAudit.transfers[0].direction === 'B->A' ? 1 : 0);
    } else if (resultWithAudit.parentResults && resultWithAudit.parentResults.length >= 2) {
      payerIndex = resultWithAudit.parentResults.findIndex((p: any) => p.isRecipient === false || p.role === 'payer' || p.role === 'B');
      if (payerIndex === -1) {
        payerIndex = resultWithAudit.parentResults[1].capacity > resultWithAudit.parentResults[0].capacity ? 1 : 0;
      }
    } else {
      payerIndex = 1;
    }
    recipientIndex = payerIndex === 0 ? 1 : 0;

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


    const careStep = tremaAudit?.result?.steps?.find((s: any) => s.key === 'care-discount');
    let appliedCareDiscount = Number(careStep?.resultMonthly ?? 0);
    const kgbCorrection = Number(tremaAudit?.result?.steps?.find((s: any) => s.key === 'payable')?.inputs?.kgbCorrection ?? 0);
    const payable = tremaAudit?.result?.payableMonthly ?? Math.max(0, payerCap - appliedCareDiscount - kgbCorrection);

    const newTransfers = [...(resultWithAudit.transfers || [])];
    if (newTransfers.length > 0 && payable > 0) {
      const basePerChild = Math.floor(payable / newTransfers.length);
      let remainder = payable - (basePerChild * newTransfers.length);

      let grossBasePerChild = Math.floor((tremaAudit?.result?.maximumContributionMonthly || 0) / newTransfers.length);
      let grossRemainder = (tremaAudit?.result?.maximumContributionMonthly || 0) - (grossBasePerChild * newTransfers.length);

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
    resultWithAudit.transfers = newTransfers;

    const totalNeed = tremaAudit?.result?.steps?.find((s: any) => s.key === 'maximum')?.inputs?.need ?? (resultWithAudit.totalNeed || 1207);
    resultWithAudit.totalNeed = totalNeed;

    const totalCap = payerCap + recipientCap + stepparentCap;
    resultWithAudit.calculationSteps = [
      { step: 1, title: "Behoefte", value: totalNeed, formula: "2026 behoeftetabel/WSF met indicatief afgeleid NBGI" },
      { step: 2, title: "Draagkracht", value: totalCap, formula: "2026 gezamenlijke draagkracht inclusief stiefouder" },
      { step: 3, title: "Draagkrachtvergelijking", value: payerCap, formula: "toegerekend aandeel onderhoudsplichtige" },
      { step: 4, title: "Zorgkorting", value: appliedCareDiscount, formula: "bruto zorgkorting minus helft tekort; bij voldoende draagkracht is de bruto zorgkorting volledig verzilverbaar" },
      { step: 5, title: "Bijdrage", value: payable, formula: "aandeel onderhoudsplichtige minus toepasselijke zorgkorting" }
    ];

    // 5. Werk parentResults en combined bij zodat pagina 1 en Tabel 4 direct het juiste bedrag tonen
    if (resultWithAudit.parentResults?.[payerIndex]) {
      resultWithAudit.parentResults[payerIndex].paymentTotal = payable;
      resultWithAudit.parentResults[payerIndex].childAlimonyPayment = payable;
    }

    if (!resultWithAudit.combined) {
      resultWithAudit.combined = {};
    }
    resultWithAudit.combined.childSupportTotal = payable;
    resultWithAudit.combined.childSupportByParent = {
      [recipientIndex]: 0,
      [payerIndex]: payable
    };
    resultWithAudit.combined.totalMonthlyPayments = payable;
    resultWithAudit.combined.combinedPaymentByParent = {
      [recipientIndex]: 0,
      [payerIndex]: payable
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
