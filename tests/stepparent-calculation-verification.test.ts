import { describe, expect, it } from "vitest";
import { runCalculationEngineV2 } from "../lib/calculation-pipeline-v2";

describe("Stepparent Calculation Verification (Tabel 4 Draagkrachtvergelijking)", () => {
  it("includes the stepparent's capacity in the denominator and reduces Pedro's child support substantially", () => {
    const input: any = {
      calculationDate: "2026-06-15",
      parents: [
        {
          id: "A",
          name: "Pedro",
          nbi: 14000,
          household: "single",
          careDaysPerWeek: 1
        },
        {
          id: "B",
          name: "Recipient",
          nbi: 2000,
          household: "married",
          careDaysPerWeek: 6,
          newPartner: {
            present: true,
            name: "Kevin",
            relationship: "MARRIED",
            monthlyNbi: 20000,
            selfSupporting: true,
            children: [
              {
                name: "Stepchild",
                age: 8,
                livesAtHome: true,
                monthlyAmount: 300
              }
            ]
          }
        }
      ],
      children: [
        {
          name: "Child",
          age: 8,
          residence: "B",
          specialCosts: 8000
        }
      ]
    };

    const calculation = runCalculationEngineV2(input, "2026.1");
    const result = calculation.result as any;

    const baselineInput = JSON.parse(JSON.stringify(input));
    baselineInput.parents[1].newPartner.relationship = "NONE";
    const baselineCalc = runCalculationEngineV2(baselineInput, "2026.1");


    console.log("With partner:", result.transfers[0].payment);
    console.log("Without partner:", baselineCalc.result.transfers[0].payment);
    expect(result.transfers[0].payment).toBeLessThan(baselineCalc.result.transfers[0].payment);

  });
});
