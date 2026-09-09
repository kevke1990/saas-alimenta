import { describe, expect, it } from "vitest";
import { professionalAdjustmentFingerprint, validateOverride } from "./professional-override";

describe("professional overrides", () => {
  it("requires a reason and value", () => {
    expect(() => validateOverride({ field: "combined.totalMonthlyPayments", overrideValue: 700, reason: "Onderbouwde professionele afwijking." })).not.toThrow();
    expect(() => validateOverride({ field: "combined.totalMonthlyPayments", overrideValue: 700, reason: "kort" })).toThrow();
  });

  it("creates a new provenance fingerprint", () => {
    const a = professionalAdjustmentFingerprint("base", { field: "combined.totalMonthlyPayments", overrideValue: 700, reason: "Onderbouwde professionele afwijking." });
    const b = professionalAdjustmentFingerprint("base", { field: "combined.totalMonthlyPayments", overrideValue: 701, reason: "Onderbouwde professionele afwijking." });
    expect(a).not.toBe(b);
  });
});
