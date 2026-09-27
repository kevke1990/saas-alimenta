import { describe, expect, it } from "vitest";
import { resolveCalculationPeriod } from "./calculation-period";

describe("calculation period gate", () => {
  it("allows an explicitly verified 2026 period", () => {
    const result = resolveCalculationPeriod("2026-09-27");
    expect(result.executable).toBe(true);
    expect(result.period.id).toBe("2026-H2");
  });

  it("blocks historical periods whose parameters are not verified", () => {
    expect(() => resolveCalculationPeriod("2019-06-01")).toThrow(/REVIEW_REQUIRED/);
  });

  it("blocks dates outside the supported registry", () => {
    expect(() => resolveCalculationPeriod("2005-12-31")).toThrow(/REVIEW_REQUIRED/);
    expect(() => resolveCalculationPeriod("2027-01-01")).toThrow(/REVIEW_REQUIRED/);
  });
});
