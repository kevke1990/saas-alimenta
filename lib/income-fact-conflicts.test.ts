import { describe, expect, it } from "vitest";
import type { FactMapping } from "./income-fact-provenance";
import {
  buildIncomeFactConflictAudit,
  getIncomeFactConflicts,
  resolveIncomeFactMappings,
  type IncomeFactConflictDecision,
} from "./income-fact-conflicts";

const mapping = (factId: string, value: number, parentIndex: 0 | 1 = 0): FactMapping => ({
  factId,
  parentIndex,
  key: "grossAnnual",
  target: "income.salaryMonthly",
  value,
  unit: "EUR per jaar",
  conversion: "annual_to_monthly",
});

describe("income fact conflicts", () => {
  it("groups competing mappings by parent and target", () => {
    expect(getIncomeFactConflicts([mapping("a", 5000), mapping("b", 6000), mapping("c", 7000, 1)])).toMatchObject([
      { conflictKey: "0:income.salaryMonthly", factIds: ["a", "b"] },
    ]);
  });

  it("rejects unresolved conflicts", () => {
    expect(() => resolveIncomeFactMappings([mapping("a", 5000), mapping("b", 6000)], [])).toThrow(/Unresolved/);
  });

  it("keeps only the explicitly selected mapping", () => {
    const decisions: IncomeFactConflictDecision[] = [{
      conflictKey: "0:income.salaryMonthly",
      selectedFactId: "b",
      decidedBy: "professional-1",
      reason: "Recent payslip is authoritative",
    }];
    expect(resolveIncomeFactMappings([mapping("a", 5000), mapping("b", 6000)], decisions)).toEqual([mapping("b", 6000)]);
  });

  it("writes an auditable decision with source document", () => {
    const audit = buildIncomeFactConflictAudit([
      { id: "b", parentIndex: 0, key: "grossAnnual", label: "Bruto", valueNumber: 72000, documentId: "doc-9" },
    ], [{
      conflictKey: "0:income.salaryMonthly",
      selectedFactId: "b",
      decidedBy: "professional-1",
      reason: "Recent payslip is authoritative",
    }]);
    expect(audit[0]).toMatchObject({
      type: "INCOME_FACT_CONFLICT_RESOLVED",
      selectedFactId: "b",
      selectedDocumentId: "doc-9",
      decidedBy: "professional-1",
    });
  });
});
