import { describe, expect, it } from "vitest";
import { buildAiFactProposals, proposalConflicts } from "./ai-fact-proposals";

describe("AI fact proposals", () => {
  it("normalizes valid extraction fields as proposed facts", () => {
    expect(buildAiFactProposals({ fields: [{ key: "grossAnnual", label: "Bruto jaarloon", valueNumber: 60000, unit: "ANNUAL", confidence: 0.94, page: 2, sourceHint: "loonstrook" }] })[0]).toMatchObject({ key: "grossAnnual", valueNumber: 60000, confidence: 0.94, page: 2, status: "PROPOSED" });
  });
  it("rejects malformed confidence values", () => {
    expect(buildAiFactProposals({ fields: [{ key: "x", label: "x", confidence: 2 }, { key: "", label: "x", confidence: .5 }] })).toEqual([]);
  });
  it("detects contradictions without selecting a winner", () => {
    const facts = buildAiFactProposals({ fields: [{ key: "bonus", label: "Bonus", valueNumber: 1000, unit: "ANNUAL", confidence: .9 }, { key: "bonus", label: "Bonus", valueNumber: 1500, unit: "ANNUAL", confidence: .8 }] });
    expect(proposalConflicts(facts)).toEqual([{ key: "bonus", count: 2 }]);
    expect(facts.every((x) => x.status === "PROPOSED")).toBe(true);
  });
});
