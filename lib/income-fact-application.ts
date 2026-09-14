import {
  applyIncomeFactMappings,
  buildIncomeFactProvenance,
  mapApprovedIncomeFacts,
  type ApprovedIncomeFact,
  type FactMapping,
} from "./income-fact-provenance";
import {
  buildIncomeFactConflictAudit,
  resolveIncomeFactMappings,
  type IncomeFactConflictDecision,
} from "./income-fact-conflicts";

export type IncomeFactApplicationResult = {
  calculationInput: any;
  mappings: FactMapping[];
  provenance: ReturnType<typeof buildIncomeFactProvenance> & {
    conflictDecisions: IncomeFactConflictDecision[];
  };
  conflictAudit: ReturnType<typeof buildIncomeFactConflictAudit>;
};

/**
 * Applies approved income facts only after deterministic conflict resolution.
 * This is intentionally pure so API routes and review UIs share one contract.
 */
export function applyApprovedIncomeFactsWithConflictResolution(
  calculationInput: any,
  facts: ApprovedIncomeFact[],
  decisions: IncomeFactConflictDecision[] = [],
): IncomeFactApplicationResult {
  const rawMappings = mapApprovedIncomeFacts(facts);
  const mappings = resolveIncomeFactMappings(rawMappings, decisions);
  const nextInput = applyIncomeFactMappings(calculationInput, mappings);
  const provenance = {
    ...buildIncomeFactProvenance(facts, mappings),
    conflictDecisions: decisions,
  };
  const conflictAudit = buildIncomeFactConflictAudit(facts, decisions);

  return {
    calculationInput: nextInput,
    mappings,
    provenance,
    conflictAudit,
  };
}
