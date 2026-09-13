import { describe, expect, it } from "vitest";
import {
  applyIncomeFactMappings,
  mapApprovedIncomeFacts,
  type ApprovedIncomeFact,
} from "./income-fact-provenance";

const baseFact = (overrides: Partial<ApprovedIncomeFact> = {}): ApprovedIncomeFact => ({
  id: "fact-edge-1",
  parentIndex: 0,
  key: "thirteenthMonth",
  label: "Dertiende maand",
  valueNumber: 250,
  valueText: null,
  unit: "EUR per maand",
  documentId: "doc-edge-1",
  ...overrides,
});

describe("income fact provenance edge cases", () => {
  it("converts monthly thirteenth-month amounts to annual values", () => {
    expect(mapApprovedIncomeFacts([baseFact()])).toEqual([
      expect.objectContaining({
        target: "income.thirteenthMonthAnnual",
        value: 3_000,
        conversion: "monthly_to_annual",
      }),
    ]);
  });

  it("keeps annual thirteenth-month amounts unchanged", () => {
    expect(mapApprovedIncomeFacts([
      baseFact({ unit: "EUR per jaar", valueNumber: 3_000 }),
    ])).toEqual([
      expect.objectContaining({
        target: "income.thirteenthMonthAnnual",
        value: 3_000,
        conversion: "direct",
      }),
    ]);
  });

  it("preserves unrelated parent data while creating missing income data", () => {
    const result = applyIncomeFactMappings(
      { parents: [{ name: "Parent 1" }, { name: "Parent 2", income: { existing: 7 } }] },
      mapApprovedIncomeFacts([baseFact({ parentIndex: 1, key: "grossAnnual", valueNumber: 72_000, unit: "EUR per jaar" })]),
    );

    expect(result.parents[0]).toEqual({ name: "Parent 1" });
    expect(result.parents[1]).toEqual({
      name: "Parent 2",
      income: { existing: 7, salaryMonthly: 6_000, mode: "GROSS" },
    });
  });
});
