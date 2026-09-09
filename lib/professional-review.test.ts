import { describe, expect, it } from "vitest";
import { buildProfessionalReviewState, isProfessionalReviewSection, PROFESSIONAL_REVIEW_SECTIONS } from "./professional-review";

describe("professional review checklist", () => {
  it("requires every professional section", () => {
    const state = buildProfessionalReviewState([]);
    expect(state.totalCount).toBe(PROFESSIONAL_REVIEW_SECTIONS.length);
    expect(state.checkedCount).toBe(0);
    expect(state.complete).toBe(false);
  });

  it("only counts checks for the active calculation snapshot", () => {
    const logs = [
      { action: "CASE_REVIEW_CHECKED", metadata: { calculationId: "old", section: "INPUT" } },
      { action: "CASE_REVIEW_CHECKED", metadata: { calculationId: "new", section: "INPUT" } },
      { action: "CASE_REVIEW_CHECKED", metadata: { calculationId: "new", section: "CALCULATION" } },
    ];
    const state = buildProfessionalReviewState(logs, "new");
    expect(state.checkedCount).toBe(2);
    expect(state.complete).toBe(false);
  });

  it("recognises only known sections", () => {
    expect(isProfessionalReviewSection("INPUT")).toBe(true);
    expect(isProfessionalReviewSection("UNKNOWN")).toBe(false);
  });
});
