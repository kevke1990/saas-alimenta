import { describe, expect, it } from "vitest";
import {
  applyIncomeFactMappings,
  mapApprovedIncomeFacts,
  type ApprovedIncomeFact,
} from "./income-fact-provenance";

const fact = (overrides: Partial<ApprovedIncomeFact> = {}): ApprovedIncomeFact => ({
  id: "fact-mode-1",
  parentIndex: 0,
  key: "netAnnual",
  label: "Netto jaarinkomen",
  valueNumber: 48_000,
  valueText: null,
  unit: "EUR per jaar",
  documentId: "doc-mode-1",
  ...overrides,
});

describe("income fact calculation modes", () => {
  it("sets NET mode when applying net annual income", () => {
    const mappings = mapApprovedIncomeFacts([fact()]);
    const result = applyIncomeFactMappings({ parents: [{ income: { mode: "GROSS" } }] }, mappings);

    expect(result.parents[0].income).toMatchObject({
      netIncomeMonthly: 4_000,
      mode: "NET",
    });
  });

  it("supports independent mappings for both parents", () => {
    const mappings = mapApprovedIncomeFacts([
      fact({ id: "fact-parent-1", parentIndex: 0, key: "grossAnnual", valueNumber: 60_000 }),
      fact({ id: "fact-parent-2", parentIndex: 1, key: "grossAnnual", valueNumber: 72_000 }),
    ]);
    const result = applyIncomeFactMappings({ parents: [{}, {}] }, mappings);

    expect(result.parents[0].income.salaryMonthly).toBe(5_000);
    expect(result.parents[1].income.salaryMonthly).toBe(6_000);
  });
});
