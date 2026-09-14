import { describe, expect, it } from "vitest";
import { applyApprovedIncomeFactsWithConflictResolution } from "@/lib/income-fact-application";

describe("applyApprovedIncomeFactsWithConflictResolution", () => {
  const facts = [
    { id: "f1", parentIndex: 0, key: "grossAnnual", label: "Bruto jaarinkomen", valueNumber: 120000, unit: "annual", documentId: "doc-1" },
    { id: "f2", parentIndex: 0, key: "grossAnnual", label: "Bruto jaarinkomen", valueNumber: 132000, unit: "annual", documentId: "doc-2" },
  ];

  it("rejects application when a conflict has no decision", () => {
    expect(() => applyApprovedIncomeFactsWithConflictResolution({ parents: [{ income: {} }, {}] }, facts)).toThrow("Unresolved income fact conflict");
  });

  it("applies the selected fact and carries provenance and audit data", () => {
    const result = applyApprovedIncomeFactsWithConflictResolution(
      { parents: [{ income: {} }, {}] },
      facts,
      [{ conflictKey: "0:income.salaryMonthly", selectedFactId: "f2", decidedBy: "professional-1", reason: "Recent payslip" }],
    );

    expect(result.calculationInput.parents[0].income.salaryMonthly).toBe(11000);
    expect(result.mappings.map(mapping => mapping.factId)).toEqual(["f2"]);
    expect(result.provenance.appliedFactIds).toEqual(["f2"]);
    expect(result.provenance.conflictDecisions[0].selectedFactId).toBe("f2");
    expect(result.conflictAudit[0]).toMatchObject({ type: "INCOME_FACT_CONFLICT_RESOLVED", selectedFactId: "f2", selectedDocumentId: "doc-2" });
  });
});
