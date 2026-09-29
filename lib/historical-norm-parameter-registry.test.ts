import { describe, expect, it } from "vitest";
import {
  HISTORICAL_NORM_PARAMETER_KEYS,
  assertHistoricalNormParameterSetComplete,
  assertNormPeriodExecutable,
  getHistoricalNormParameterRecords,
  isHistoricalNormParameterSetComplete,
  isNormPeriodExecutable,
} from "./historical-norm-parameter-registry";

describe("historical norm parameter registry", () => {
  it("defines a fixed completeness contract", () => {
    expect(HISTORICAL_NORM_PARAMETER_KEYS.length).toBe(7);
    expect(new Set(HISTORICAL_NORM_PARAMETER_KEYS).size).toBe(HISTORICAL_NORM_PARAMETER_KEYS.length);
  });

  it("starts with no historical period falsely marked executable", () => {
    expect(getHistoricalNormParameterRecords("2006")).toHaveLength(0);
    expect(isHistoricalNormParameterSetComplete("2006")).toBe(false);
    expect(isNormPeriodExecutable("2006")).toBe(false);
    expect(() => assertHistoricalNormParameterSetComplete("2006")).toThrow(/REVIEW_REQUIRED/);
    expect(() => assertNormPeriodExecutable("2006")).toThrow(/REVIEW_REQUIRED/);
  });

  it("fails closed for unknown periods", () => {
    expect(isNormPeriodExecutable("not-a-period")).toBe(false);
    expect(() => assertNormPeriodExecutable("not-a-period")).toThrow(/REVIEW_REQUIRED/);
  });

  it("recognizes current and independently verified historical executable norm years", () => {
    expect(isNormPeriodExecutable("2024")).toBe(true);
    expect(isNormPeriodExecutable("2025")).toBe(true);
    expect(isNormPeriodExecutable("2026")).toBe(true);
    expect(isNormPeriodExecutable("2023")).toBe(true);
    expect(isNormPeriodExecutable("2022")).toBe(false);
    expect(isNormPeriodExecutable("2026-H2")).toBe(true);
  });
});
