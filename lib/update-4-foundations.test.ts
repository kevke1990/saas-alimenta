import { describe, expect, it } from "vitest";
import { classifyDocument } from "./document-classification";
import { calculateVatExclusive, calculateVatInclusive, canCreateActiveCase } from "./billing";
import { buildReferenceWarnings, roundEuro } from "./calculation-reference";

describe("Update 4 foundations", () => {
  it("classifies common income documents deterministically", () => {
    expect(classifyDocument("loonstrook september.pdf").category).toBe("INKOMEN");
    expect(classifyDocument("huurcontract.pdf").category).toBe("WOONLASTEN");
    expect(classifyDocument("onbekend.pdf").category).toBe("OVERIG");
  });

  it("keeps billing entitlement server-side and VAT arithmetic deterministic", () => {
    expect(canCreateActiveCase("PRIVATE", 0)).toBe(true);
    expect(canCreateActiveCase("PRIVATE", 1)).toBe(false);
    expect(canCreateActiveCase("PRO", 4)).toBe(true);
    expect(canCreateActiveCase("PRO", 5)).toBe(false);
    expect(calculateVatInclusive(10000)).toEqual({ netCents: 10000, vatCents: 2100, grossCents: 12100 });
    expect(calculateVatExclusive(12100)).toEqual({ netCents: 10000, vatCents: 2100, grossCents: 12100 });
  });

  it("exposes explicit calculation review signals", () => {
    expect(roundEuro(123.6)).toBe(124);
    const warnings = buildReferenceWarnings({
      historicalNbgiSupplied: false,
      capacitySufficient: false,
      youngAdultPresent: true,
      professionalOverridePresent: true,
    });
    expect(warnings.map(w => w.code)).toEqual([
      "HISTORICAL_NBGI_REQUIRED",
      "CAPACITY_INSUFFICIENT",
      "YOUNG_ADULT",
      "PROFESSIONAL_REVIEW_REQUIRED",
    ]);
  });
});
