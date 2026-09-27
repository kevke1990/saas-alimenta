import { describe, expect, it } from "vitest";
import { assertCalculationPeriodSupported } from "./alimentatie-engine-adapter";

describe("alimentatie engine adapter calculation-period gate", () => {
  it("allows the current 2026 period", () => {
    expect(() => assertCalculationPeriodSupported({ calculationDate: "2026-09-27", referenceYear: 2026 })).not.toThrow();
  });

  it("rejects a historical period before the historical engine is activated", () => {
    expect(() => assertCalculationPeriodSupported({ calculationDate: "2008-08-01", referenceYear: 2008 })).toThrow(
      /REVIEW_REQUIRED/,
    );
  });

  it("rejects a currently registered but unsupported historical period instead of falling back to 2026", () => {
    expect(() => assertCalculationPeriodSupported({ calculationDate: "2025-06-01", referenceYear: 2025 })).toThrow(
      /REVIEW_REQUIRED/,
    );
  });

  it("requires an exact date when a non-2026 year is requested", () => {
    expect(() => assertCalculationPeriodSupported({ referenceYear: 2025 })).toThrow(
      /exacte berekeningsdatum verplicht/,
    );
  });

  it("fails closed for an invalid date", () => {
    expect(() => assertCalculationPeriodSupported({ calculationDate: "2026-02-31", referenceYear: 2026 })).toThrow(
      /REVIEW_REQUIRED/,
    );
  });
});
