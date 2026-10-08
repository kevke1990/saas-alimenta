import { describe, expect, it } from "vitest";
import { assertCalculationPeriodSupported } from "../lib/alimentatie-engine-adapter";

describe("Historical Periods Fail-Closed Behavior", () => {
  it("allows 2026 reference year calculations", () => {
    expect(() => assertCalculationPeriodSupported({ referenceYear: 2026, calculationDate: "2026-06-15" })).not.toThrow();
  });

  it("throws REVIEW_REQUIRED if an old year is passed but it's not fully supported/activated", () => {
    // 2025 is not completely implemented based on the prompt instructions
    expect(() => assertCalculationPeriodSupported({ referenceYear: 2025, calculationDate: "2025-06-15" }))
      .toThrow(/REVIEW_REQUIRED/);
  });

  it("throws REVIEW_REQUIRED if calculationDate is missing for historical calculation", () => {
    expect(() => assertCalculationPeriodSupported({ referenceYear: 2025 }))
      .toThrow(/REVIEW_REQUIRED.*exacte berekeningsdatum verplicht/);
  });
});
