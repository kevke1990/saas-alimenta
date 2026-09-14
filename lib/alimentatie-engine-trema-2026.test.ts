import { describe, expect, it } from "vitest";
import {
  calculateCorrectedNorm,
  calculateTrema2026,
  correctedAssistanceNorm2026,
} from "@/lib/alimentatie-engine-trema-2026";
import { adaptAlimentaForm } from "@/lib/alimentatie-engine-adapter";

describe("Trema 2026 engine", () => {
  it("calculates the published corrected assistance norm example", () => {
    expect(
      correctedAssistanceNorm2026({
        assistanceNormMonthly: 1402,
        housingComponentMonthly: 201,
        healthPremiumMonthly: 177,
        healthNormPremiumMonthly: 65,
        unforeseenCostsMonthly: 50,
      }),
    ).toBe(1365);
  });

  it("applies the AOW minimum corrected norm", () => {
    expect(
      correctedAssistanceNorm2026({
        assistanceNormMonthly: 1000,
        housingComponentMonthly: 200,
        healthPremiumMonthly: 100,
        healthNormPremiumMonthly: 65,
        unforeseenCostsMonthly: 0,
        aowEligible: true,
      }),
    ).toBe(1525);
  });

  it("refuses to calculate without an applicable corrected norm", () => {
    expect(() =>
      calculateCorrectedNorm({
        income: { monthlyNbi: 3000, referenceYear: 2026 },
        household: "single",
      }),
    ).toThrow("Ontbrekende gecorrigeerde bijstandsnorm");
  });

  it("calculates an auditable result with formula steps", () => {
    const result = calculateTrema2026({
      referenceYear: 2026,
      need: { ownShareMonthly: 500 },
      payer: {
        id: "A",
        capacity: {
          income: { monthlyNbi: 3000, monthlyKgb: 0, referenceYear: 2026 },
          household: "single",
          correctedAssistanceNormMonthly: 1365,
        },
      },
      recipient: {
        id: "B",
        capacity: {
          income: { monthlyNbi: 2200, monthlyKgb: 0, referenceYear: 2026 },
          household: "single",
          correctedAssistanceNormMonthly: 1365,
        },
      },
      care: { carePercentage: 20 },
    });

    expect(result.referenceYear).toBe(2026);
    expect(result.payableMonthly).toBe(400);
    expect(result.steps.map((step) => step.key)).toEqual([
      "capacity.A",
      "capacity.B",
      "care-discount",
      "maximum",
      "payable",
    ]);
    expect(result.sources.length).toBeGreaterThan(0);
  });

  it("adapts form payloads into the engine input", () => {
    const input = adaptAlimentaForm({
      need: { ownShareMonthly: "500,00" },
      payer: {
        monthlyNbi: "3000",
        correctedAssistanceNormMonthly: 1365,
      },
      recipient: {
        monthlyNbi: 2200,
        correctedAssistanceNormMonthly: 1365,
      },
    });

    expect(input.referenceYear).toBe(2026);
    expect(input.payer.capacity.income.monthlyNbi).toBe(3000);
    expect(input.need.ownShareMonthly).toBe(500);
  });
});
