import { describe, expect, it } from "vitest";
import { buildExplainableIntelligence } from "./explainable-intelligence";

describe("buildExplainableIntelligence", () => {
  it("returns actionable evidence-backed signals", () => {
    const signals = buildExplainableIntelligence({
      reviewStatus: "READY_FOR_REVIEW", calculationCount: 2, latestNormVersion: "2025.1", activeNormVersion: "2026.1",
      proposedIncomeFacts: 2, lowConfidenceIncomeFacts: 1, documentsAwaitingReview: 1, documentAnalysisErrors: 0,
      missingEvidenceFields: ["inkomen.personA"], latestTotalMonthly: 1800, previousTotalMonthly: 1400,
    });
    expect(signals.map(s => s.key)).toEqual(expect.arrayContaining(["MISSING_EVIDENCE", "LOW_CONFIDENCE_INCOME", "STALE_NORM", "CALCULATION_CHANGE", "REVIEW_REQUIRED"]));
    expect(signals.every(s => s.explanation && s.action && s.evidence.length > 0 && s.confidence >= 0 && s.confidence <= 1)).toBe(true);
    expect(signals[0].severity).toBe("HIGH");
  });
  it("does not invent a calculation warning without two calculations", () => {
    const signals = buildExplainableIntelligence({ reviewStatus: "FINAL", calculationCount: 1, proposedIncomeFacts: 0, lowConfidenceIncomeFacts: 0, documentsAwaitingReview: 0, documentAnalysisErrors: 0, missingEvidenceFields: [] });
    expect(signals.some(s => s.key === "CALCULATION_CHANGE")).toBe(false);
  });
});
