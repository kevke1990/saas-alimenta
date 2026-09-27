import { describe, expect, it } from "vitest";
import {
  HISTORICAL_NORM_PARAMETER_KEYS,
  assertHistoricalNormParameterSetComplete,
  getHistoricalNormParameterRecords,
  isHistoricalNormParameterSetComplete,
} from "./historical-norm-parameter-registry";

describe("historical norm parameter registry", () => {
  it("defines a fixed completeness contract", () => {
    expect(HISTORICAL_NORM_PARAMETER_KEYS.length).toBeGreaterThanOrEqual(7);
    expect(new Set(HISTORICAL_NORM_PARAMETER_KEYS).size).toBe(
      HISTORICAL_NORM_PARAMETER_KEYS.length,
    );
  });

  it("starts with no historical period falsely marked executable", () => {
    expect(getHistoricalNormParameterRecords("2006")).toHaveLength(0);
    expect(isHistoricalNormParameterSetComplete("2006")).toBe(false);
    expect(() => assertHistoricalNormParameterSetComplete("2006")).toThrow(
      /REVIEW_REQUIRED/,
    );
  });

  it("fails closed for unknown periods", () => {
    expect(isHistoricalNormParameterSetComplete("not-a-period")).toBe(false);
    expect(() => assertHistoricalNormParameterSetComplete("not-a-period")).toThrow(
      /REVIEW_REQUIRED/,
    );
  });
});
