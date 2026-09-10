export type ApprovedIncomeFact = {
  id: string;
  parentIndex: number | null;
  key: string;
  label: string;
  valueNumber: number | null;
  valueText?: string | null;
  unit?: string | null;
  documentId: string;
  confidence?: number | null;
};

export type FactMapping = {
  factId: string;
  parentIndex: 0 | 1;
  key: string;
  target: string;
  value: number;
  unit: string | null;
  conversion: string;
};

function annualToMonthly(value: number) {
  return Math.round((value / 12) * 100) / 100;
}

/** Maps only deterministic calculation-input equivalents; unknown AI facts are ignored. */
export function mapApprovedIncomeFacts(facts: ApprovedIncomeFact[]): FactMapping[] {
  const mappings: FactMapping[] = [];
  for (const fact of facts) {
    if (fact.parentIndex !== 0 && fact.parentIndex !== 1) continue;
    if (typeof fact.valueNumber !== "number" || !Number.isFinite(fact.valueNumber)) continue;

    const annual = /annual|jaar|per jaar/i.test(fact.unit || "");
    const monthly = /monthly|month|maand|per maand/i.test(fact.unit || "");
    const value = annual && !monthly ? annualToMonthly(fact.valueNumber) : fact.valueNumber;
    const parentIndex = fact.parentIndex as 0 | 1;

    if (fact.key === "grossAnnual") mappings.push({ factId: fact.id, parentIndex, key: fact.key, target: "income.salaryMonthly", value, unit: fact.unit || null, conversion: annual ? "annual_to_monthly" : "direct" });
    else if (fact.key === "holidayAllowance") mappings.push({ factId: fact.id, parentIndex, key: fact.key, target: "income.holidayAllowanceMonthly", value, unit: fact.unit || null, conversion: annual ? "annual_to_monthly" : "direct" });
    else if (fact.key === "thirteenthMonth") mappings.push({ factId: fact.id, parentIndex, key: fact.key, target: "income.thirteenthMonthAnnual", value: annual || !monthly ? fact.valueNumber : fact.valueNumber * 12, unit: fact.unit || null, conversion: annual || !monthly ? "direct" : "monthly_to_annual" });
    else if (fact.key === "ikb") mappings.push({ factId: fact.id, parentIndex, key: fact.key, target: "income.ikbMonthly", value, unit: fact.unit || null, conversion: annual ? "annual_to_monthly" : "direct" });
    else if (fact.key === "pensionPremium") mappings.push({ factId: fact.id, parentIndex, key: fact.key, target: "income.pensionMonthly", value, unit: fact.unit || null, conversion: annual ? "annual_to_monthly" : "direct" });
    else if (fact.key === "netAnnual") mappings.push({ factId: fact.id, parentIndex, key: fact.key, target: "income.netIncomeMonthly", value, unit: fact.unit || null, conversion: annual ? "annual_to_monthly" : "direct" });
  }
  return mappings;
}

export function applyIncomeFactMappings(data: any, mappings: FactMapping[]) {
  const next = structuredClone(data);
  for (const mapping of mappings) {
    const parent = next.parents?.[mapping.parentIndex];
    if (!parent) continue;
    parent.income = { ...(parent.income || {}) };
    const field = mapping.target.split(".").at(-1)!;
    parent.income[field] = mapping.value;
    if (mapping.key === "grossAnnual") parent.income.mode = "GROSS";
    if (mapping.key === "netAnnual") parent.income.mode = "NET";
  }
  return next;
}

export function buildIncomeFactProvenance(facts: ApprovedIncomeFact[], mappings: FactMapping[]) {
  const mappedIds = new Set(mappings.map(m => m.factId));
  return {
    source: "APPROVED_INCOME_FACTS",
    generatedAt: new Date().toISOString(),
    approvedFactIds: facts.map(f => f.id),
    appliedFactIds: mappings.map(m => m.factId),
    ignoredFactIds: facts.filter(f => !mappedIds.has(f.id)).map(f => f.id),
    mappings,
  };
}
