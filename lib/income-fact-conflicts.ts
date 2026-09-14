import type { ApprovedIncomeFact, FactMapping } from "./income-fact-provenance";

export type IncomeFactConflict = {
  conflictKey: string;
  parentIndex: 0 | 1;
  target: string;
  factIds: string[];
  mappings: FactMapping[];
};

export type IncomeFactConflictDecision = {
  conflictKey: string;
  selectedFactId: string;
  decidedBy: string;
  reason: string;
};

export function getIncomeFactConflicts(mappings: FactMapping[]): IncomeFactConflict[] {
  const grouped = new Map<string, FactMapping[]>();
  for (const mapping of mappings) {
    const key = `${mapping.parentIndex}:${mapping.target}`;
    grouped.set(key, [...(grouped.get(key) || []), mapping]);
  }
  return [...grouped.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([conflictKey, group]) => ({
      conflictKey,
      parentIndex: group[0].parentIndex,
      target: group[0].target,
      factIds: group.map((mapping) => mapping.factId),
      mappings: group,
    }));
}

export function resolveIncomeFactMappings(
  mappings: FactMapping[],
  decisions: IncomeFactConflictDecision[],
): FactMapping[] {
  const conflicts = getIncomeFactConflicts(mappings);
  const decisionsByKey = new Map(decisions.map((decision) => [decision.conflictKey, decision]));
  const conflictKeys = new Set(conflicts.map((conflict) => conflict.conflictKey));

  for (const conflict of conflicts) {
    const decision = decisionsByKey.get(conflict.conflictKey);
    if (!decision || !conflict.factIds.includes(decision.selectedFactId) || !decision.decidedBy.trim() || !decision.reason.trim()) {
      throw new Error(`Unresolved income fact conflict: ${conflict.conflictKey}`);
    }
  }

  return mappings.filter((mapping) => {
    const key = `${mapping.parentIndex}:${mapping.target}`;
    if (!conflictKeys.has(key)) return true;
    return decisionsByKey.get(key)?.selectedFactId === mapping.factId;
  });
}

export function buildIncomeFactConflictAudit(
  facts: ApprovedIncomeFact[],
  decisions: IncomeFactConflictDecision[],
) {
  const factById = new Map(facts.map((fact) => [fact.id, fact]));
  return decisions.map((decision) => ({
    type: "INCOME_FACT_CONFLICT_RESOLVED",
    conflictKey: decision.conflictKey,
    selectedFactId: decision.selectedFactId,
    selectedDocumentId: factById.get(decision.selectedFactId)?.documentId || null,
    decidedBy: decision.decidedBy,
    reason: decision.reason,
    createdAt: new Date().toISOString(),
  }));
}
