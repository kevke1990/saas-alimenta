import { calculate, type CaseInput } from './calculator';
import { calculatePartnerSupport } from './partner-engine';

export const SCENARIO_ENGINE_VERSION = '1.2.0';

export type ScenarioChanges = {
  parents?: Record<'0'|'1', Partial<CaseInput['parents'][number]>>;
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

export function calculateScenario(base: CaseInput, changes: ScenarioChanges, partnerInput?: Record<string, unknown>) {
  const input = applyScenarioChanges(base, changes);
  const childResult = calculate(input);
  let partnerResult: ReturnType<typeof calculatePartnerSupport> | null = null;
  if (partnerInput) {
    const suggestedChildSupport = Array.isArray((childResult as any).transfers)
      ? (childResult as any).transfers.reduce((s: number, t: any) => s + Number(t.payment || 0), 0)
      : 0;
    partnerResult = calculatePartnerSupport({ ...partnerInput, currentChildSupport: suggestedChildSupport });
  }
  return { engineVersion: SCENARIO_ENGINE_VERSION, input, child: childResult, partner: partnerResult };
}
