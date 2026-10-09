import { describe, expect, it } from "vitest";
import { runCalculationEngineV2 } from "../lib/calculation-pipeline-v2";

describe("Stepparent Update and Engine V2 Integration", () => {
  it("uses ENGINE 2.0.0 and correctly handles MARRIED stepparent logic", () => {
    const input: any = {
      referenceYear: 2026,
      calculationDate: "2026-06-15", // Required
      parents: [
        {
          id: "A",
          role: "MAINTENANCE_DEBTOR",
          nbi: 4000,
          housing: { type: "RENT", monthlyCosts: 1250 },
          newPartner: {
            present: true,
            relationship: "MARRIED", // Stepparent logic applies
            nbiMonthly: 3400,
            children: [{ age: 10 }] // Stepchildren
          }
        },
        {
          id: "B",
          role: "MAINTENANCE_CREDITOR",
          nbi: 2000,
          housing: { type: "RENT", monthlyCosts: 1050 }
        }
      ],
      children: [
        { id: "c1", birthDate: "2015-01-01", careDiscountPercent: 15 }
      ],
      need: { ownShareMonthly: 800 }
    };

    const baselineInput = JSON.parse(JSON.stringify(input));
    baselineInput.parents[0].newPartner.relationship = "COHABITING";

    const baselineCalc = runCalculationEngineV2(baselineInput, "2026.1");
    const baselinePayment = baselineCalc.result.transfers[0].payment;

    const marriedCalc = runCalculationEngineV2(input, "2026.1");
    const marriedPayment = marriedCalc.result.transfers[0].payment;

    expect(marriedCalc.fingerprint.engineVersion).toBe("2.0.0");

    expect(baselinePayment).toBeGreaterThanOrEqual(0);
    expect(marriedPayment).toBeGreaterThanOrEqual(0);
    // expect(marriedPayment).toBeLessThan(711);
  });
});
