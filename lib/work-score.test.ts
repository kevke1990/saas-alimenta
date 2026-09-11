import { describe, expect, it } from "vitest";
import { calculateWorkScore } from "./work-score";

describe("dossier work-priority score", () => {
  it("keeps a clean final dossier low priority", () => {
    expect(calculateWorkScore({
      reviewStatus: "FINAL",
      calculationCount: 1,
      proposedIncomeFacts: 0,
      documentsAwaitingReview: 0,
      documentAnalysisErrors: 0,
    })).toEqual({ score: 100, priority: "LOW", reasons: [] });
  });

  it("prioritizes dossiers with review work and unresolved facts", () => {
    const result = calculateWorkScore({
      reviewStatus: "READY_FOR_REVIEW",
      calculationCount: 1,
      proposedIncomeFacts: 2,
      documentsAwaitingReview: 1,
      documentAnalysisErrors: 0,
    });
    expect(result.score).toBe(64);
    expect(result.priority).toBe("NORMAL");
    expect(result.reasons).toHaveLength(3);
  });

  it("marks missing calculations and analysis errors as urgent work", () => {
    const result = calculateWorkScore({
      reviewStatus: "INCOMPLETE",
      calculationCount: 0,
      proposedIncomeFacts: 3,
      documentsAwaitingReview: 2,
      documentAnalysisErrors: 1,
      calculationStale: true,
      largeCalculationChange: true,
    });
    expect(result.score).toBe(12);
    expect(result.priority).toBe("URGENT");
    expect(result.reasons).toHaveLength(7);
  });

  it("is deterministic and does not depend on calculation values", () => {
    const input = {
      reviewStatus: "APPROVED",
      calculationCount: 2,
      proposedIncomeFacts: 1,
      documentsAwaitingReview: 0,
      documentAnalysisErrors: 0,
      calculationStale: true,
    } as const;
    expect(calculateWorkScore(input)).toEqual(calculateWorkScore(input));
  });
});
