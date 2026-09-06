import { calculate, type CaseInput } from './calculator';
import { calculatePartnerSupport, type PartnerSupportInput } from './partner-engine';
import { buildCombinedAudit } from './combined-audit';

export const SCENARIO_ENGINE_VERSION = '1.3.1';

export type ScenarioChanges = {
  parents?: Partial<Record<'0'|'1', Partial<CaseInput['parents'][number]>>>;
  children?: Record<string, Partial<CaseInput['children'][number]>>;
  historicalNBGI?: number;
};

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }

export function applyScenarioChanges(base: CaseInput, changes: ScenarioChanges): CaseInput {
  const next = clone(base);
  if (changes.historicalNBGI !== undefined) next.historicalNBGI = changes.historicalNBGI;
  for (const [idx, patch] of Object.entries(changes.parents || {})) {
    const i = Number(idx);
    if (next.parents[i]) next.parents[i] = { ...next.parents[i], ...patch };
  }
  for (const [idx, patch] of Object.entries(changes.children || {})) {
    const i = Number(idx);
    if (next.children[i]) next.children[i] = { ...next.children[i], ...patch };
  }
  return next;
}

export function calculateScenario(base: CaseInput, changes: ScenarioChanges, partnerInput?: Partial<PartnerSupportInput> & { payerIndex?: 0 | 1 }) {
  const input = applyScenarioChanges(base, changes);
  const childResult = calculate(input);
  let partnerResult: ReturnType<typeof calculatePartnerSupport> | null = null;
  let combinedAudit = buildCombinedAudit({
    childSupportByParent: [0, 0],
    partnerPayerIndex: null,
    partnerMonthlyNet: 0,
    partnerMonthlyGross: 0,
    partnerCapacityRemainingNet: 0,
  });

  const childSupportByParent = [0, 0];
  for (const transfer of childResult.transfers || []) childSupportByParent[transfer.payerIndex] += Number(transfer.payment || 0);

  if (partnerInput) {
    const payerIndex = partnerInput.payerIndex === 1 ? 1 : 0;
    partnerResult = calculatePartnerSupport({
      historicalNBGI: partnerInput.historicalNBGI ?? 0,
      historicalChildCosts: partnerInput.historicalChildCosts ?? 0,
      currentRecipientNBI: partnerInput.currentRecipientNBI ?? 0,
      currentPayerNBI: partnerInput.currentPayerNBI ?? 0,
      ...partnerInput,
      currentChildSupport: childSupportByParent[payerIndex],
    });
    combinedAudit = buildCombinedAudit({
      childSupportByParent,
      partnerPayerIndex: payerIndex,
      partnerMonthlyNet: partnerResult.result.monthlyNet,
      partnerMonthlyGross: partnerResult.result.monthlyGross,
      partnerCapacityRemainingNet: partnerResult.capacity.remainingNet,
    });
  }

  const partnerPayerIndex = partnerInput?.payerIndex === 1 ? 1 : partnerInput ? 0 : null;
  const partnerNet = partnerResult?.result.monthlyNet || 0;
  const partnerGross = partnerResult?.result.monthlyGross || 0;
  const combinedPaymentByParent = [...childSupportByParent];
  if (partnerPayerIndex !== null) combinedPaymentByParent[partnerPayerIndex] += partnerGross;

  return {
    engineVersion: SCENARIO_ENGINE_VERSION,
    input,
    child: childResult,
    partner: partnerResult,
    combined: {
      childSupportTotal: childSupportByParent.reduce((a, b) => a + b, 0),
      childSupportByParent,
      partnerSupportMonthlyNet: partnerNet,
      partnerSupportMonthlyGross: partnerGross,
      totalMonthlyPayments: combinedPaymentByParent.reduce((a, b) => a + b, 0),
      paymentByParent: combinedPaymentByParent,
      priorityAudit: combinedAudit,
    },
  };
}
