import { describe, expect, it } from "vitest";
import {
  applyIncomeFactMappings,
  buildIncomeFactProvenance,
  mapApprovedIncomeFacts,
  type ApprovedIncomeFact,
} from "./income-fact-provenance";

const fact = (overrides: Partial<ApprovedIncomeFact> = {}): ApprovedIncomeFact => ({
  id: "fact-1",
  parentIndex: 0,
  key: "grossAnnual",
  label: "Bruto jaarinkomen",
  valueNumber: 60_000,
  valueText: null,
  unit: "EUR per jaar",
  documentId: "doc-1",
  confidence: 0.94,
  ...overrides,
});

describe("income fact provenance", () => {
  it("maps annual gross income to monthly salary", () => {
    expect(mapApprovedIncomeFacts([fact()])).toEqual([
      expect.objectContaining({
        factId: "fact-1",
        parentIndex: 0,
        target: "income.salaryMonthly",
        value: 5_000,
        conversion: "annual_to_monthly",
      }),
    ]);
  });

  it("maps monthly facts without converting them", () => {
    const mappings = mapApprovedIncomeFacts([
      fact({ key: "ikb", unit: "EUR per maand", valueNumber: 250 }),
    ]);
    expect(mappings[0]).toMatchObject({
      target: "income.ikbMonthly",
      value: 250,
      conversion: "direct",
    });
  });

  it("ignores facts without a valid parent or numeric value", () => {
    expect(mapApprovedIncomeFacts([
      fact({ parentIndex: null }),
      fact({ id: "fact-2", valueNumber: null }),
      fact({ id: "fact-3", parentIndex: 2 }),
    ])).toEqual([]);
  });

  it("ignores unsupported keys instead of changing calculation input", () => {
    expect(mapApprovedIncomeFacts([fact({ key: "unknownField" })])).toEqual([]);
  });

  it("applies mappings to the correct parent without mutating input", () => {
    const input = { parents: [{ income: { salaryMonthly: 1 } }, { income: { salaryMonthly: 2 } }] };
    const mappings = mapApprovedIncomeFacts([fact({ parentIndex: 1 })]);
    const output = applyIncomeFactMappings(input, mappings);
    expect(output.parents[1].income.salaryMonthly).toBe(5_000);
    expect(output.parents[0].income.salaryMonthly).toBe(1);
    expect(input.parents[1].income.salaryMonthly).toBe(2);
  });

  it("records applied and ignored fact IDs", () => {
    const approved = [fact(), fact({ id: "fact-2", key: "unsupported" })];
    const mappings = mapApprovedIncomeFacts(approved);
    expect(buildIncomeFactProvenance(approved, mappings)).toMatchObject({
      source: "APPROVED_INCOME_FACTS",
      approvedFactIds: ["fact-1", "fact-2"],
      appliedFactIds: ["fact-1"],
      ignoredFactIds: ["fact-2"],
    });
  });
});
