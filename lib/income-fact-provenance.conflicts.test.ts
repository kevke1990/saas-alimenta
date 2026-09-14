import { describe, expect, it } from "vitest";
import {
  buildIncomeFactProvenance,
  mapApprovedIncomeFacts,
  type ApprovedIncomeFact,
} from "./income-fact-provenance";

const fact = (id: string, valueNumber: number): ApprovedIncomeFact => ({
  id,
  parentIndex: 0,
  key: "grossAnnual",
  label: "Bruto jaarinkomen",
  valueNumber,
  unit: "EUR per jaar",
  documentId: `doc-${id}`,
});

describe("income fact conflict provenance", () => {
  it("flags multiple approved facts targeting the same calculation field", () => {
    const facts = [fact("fact-1", 60_000), fact("fact-2", 72_000)];
    const mappings = mapApprovedIncomeFacts(facts);
    const provenance = buildIncomeFactProvenance(facts, mappings);

    expect(provenance.conflictFactIds).toEqual(["fact-1", "fact-2"]);
    expect(provenance.mappings).toHaveLength(2);
  });

  it("does not flag independent parents as a conflict", () => {
    const facts = [fact("fact-1", 60_000), { ...fact("fact-2", 72_000), parentIndex: 1 as const }];
    const mappings = mapApprovedIncomeFacts(facts);
    const provenance = buildIncomeFactProvenance(facts, mappings);

    expect(provenance.conflictFactIds).toEqual([]);
  });
});
