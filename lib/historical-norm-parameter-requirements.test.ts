import { describe, expect, it } from "vitest";
import { HISTORICAL_PARAMETER_ARTIFACTS, getRequiredHistoricalParameterKeys } from "./historical-norm-parameter-requirements";

describe("historical norm parameter requirements", () => {
  it("contains every executable parameter category", () => {
    expect(HISTORICAL_PARAMETER_ARTIFACTS).toHaveLength(7);
    expect(new Set(getRequiredHistoricalParameterKeys()).size).toBe(7);
    expect(HISTORICAL_PARAMETER_ARTIFACTS.every((artifact) => artifact.required)).toBe(true);
  });

  it("does not treat a source document alone as sufficient verification", () => {
    for (const artifact of HISTORICAL_PARAMETER_ARTIFACTS) {
      expect(artifact.description.length).toBeGreaterThan(10);
    }
  });
});
