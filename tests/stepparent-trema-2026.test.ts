import { describe, expect, it } from "vitest";
import { runCalculationEngineV2 } from "../lib/calculation-pipeline-v2";

describe("Trema 2026 Stepparent Calculation", () => {
  it("distributes payment across all children and shows 3 parties", () => {
    const input: any = {
      calculationDate: "2026-06-15",
      parents: [
        {
          id: "A",
          name: "Pedro",
          nbi: 3400,
          household: "single",
          careDaysPerWeek: 1
        },
        {
          id: "B",
          name: "Dianne",
          nbi: 900,
          household: "married",
          careDaysPerWeek: 6,
          newPartner: {
            present: true,
            name: "Kevin",
            relationship: "MARRIED",
            monthlyNbi: 3400,
            selfSupporting: true,
            children: [
              { name: "Eigen kind 1", age: 10, livesAtHome: true, monthlyAmount: 100 },
              { name: "Eigen kind 2", age: 12, livesAtHome: true, monthlyAmount: 100 }
            ]
          }
        }
      ],
      children: [
        { name: "Djelena", age: 12, residence: "B", specialCosts: 40, need: 380, baseNeed: 380 },
        { name: "Jezley", age: 8, residence: "B", specialCosts: 26, need: 380, baseNeed: 380 },
        { name: "Jaivey", age: 4, residence: "B", specialCosts: 0, need: 381, baseNeed: 381 }
      ],
      need: { ownShareMonthly: 1207, totalNeedMonthly: 1207, exceptionalCostsMonthly: 0, alreadyIncludedExceptionalCostsMonthly: 0 },
      care: { carePercentage: 5, careDiscountBaseMonthly: 1140, careDiscountOverrideMonthly: 57 }
    };

    const calculation = runCalculationEngineV2(input, "2026.1");
    const result = calculation.result as any;

    expect(result.transfers.length).toBe(3);

    // Check if every child has a payment > 0
    expect(result.transfers.every((child: any) => child.payment > 0)).toBe(true);

    // Verify capacities and payment total match exactly the assignments
    const payerIndex = result.transfers[0].payerIndex ?? (result.transfers[0].direction === 'B->A' ? 1 : 0);
    const recipientIndex = payerIndex === 0 ? 1 : 0;

    expect(result.parentResults[payerIndex].capacity).toBeGreaterThan(0);
    expect(result.parentResults[recipientIndex].capacity).toBeDefined();

    const totalPayment = result.transfers.reduce((sum: number, t: any) => sum + t.payment, 0);
    expect(result.parentResults[payerIndex].paymentTotal).toBe(calculation.result.tremaAudit.result?.payableMonthly);
    expect(result.totalCapacity).toBe(
      result.parentResults[payerIndex].capacity +
      result.parentResults[recipientIndex].capacity +
      (calculation.result.tremaAudit.result?.stepparentCapacity || 0)
    );

    // Validate joint capacity of €1,137
    expect(Math.round(result.totalCapacity)).toBe(1137);

    // Validate cashable care discount of €22
    const careDiscountStep = result.calculationSteps.find((s: any) => s.title === "Zorgkorting");
    expect(Math.round(careDiscountStep.value)).toBe(22);

    // Validate final payments split as €230, €230, and €229
    const payments = result.transfers.map((t: any) => t.payment).sort((a: number, b: number) => b - a);
    expect(payments).toEqual([230, 230, 229]);

    // Validate `calculationSteps` values
    const stepValues = result.calculationSteps.map((s: any) => Math.round(s.value));
    expect(stepValues).toEqual([1207, 1137, 711, 22, 689]);
  });
});