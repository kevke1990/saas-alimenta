import { describe, expect, it } from "vitest";
import { runCalculationEngineV2 } from "../lib/calculation-pipeline-v2";

describe("Productie 8", () => {
  it("berekent Productie 8 correct (geïndexeerde behoefte, werkelijke woonlast, geen tekort)", () => {
    const input: any = {
      calculationDate: "2026-06-15",
      historicalPeriod: { calculationDate: "2024-06-15", kgbIncluded: true },
      historicalNBGI: 4314, // 2024 NBGI
      parents: [
        {
          id: "A",
          name: "Dianne",
          nbi: 1233, // Or Gross 10368 + KGB 4428. With NBI 1233, capacity should be 0.
          household: "single",
          careDaysPerWeek: 7,
          housingCostMode: "ACTUAL",
          actualHousingCost: 267
        },
        {
          id: "B",
          name: "Pedro",
          nbi: 3605, // Gross 58320 (4500/mo + 8% VT) -> Need to just pass 3605 here as the adapter would
          household: "single",
          careDaysPerWeek: 0, // 0% zorgkorting
          housingCostMode: "ACTUAL",
          actualHousingCost: 200
        }
      ],
      children: [
        { name: "Kind 1", age: 12, residence: "A", specialCosts: 0 },
        { name: "Kind 2", age: 8, residence: "A", specialCosts: 0 },
        { name: "Kind 3", age: 4, residence: "A", specialCosts: 0 }
      ],
      care: { carePercentage: 0, careDiscountBaseMonthly: 1223, careDiscountOverrideMonthly: 0 }
    };

    const calculation = runCalculationEngineV2(input, "2026.1");
    const result = calculation.result as any;

    expect(result.totalNeed).toBe(1223); // 1097 * 1.062 * 1.049 = ~1223
    expect(result.parentResults[1].capacity).toBe(1428); // Pedro's capacity
    expect(result.capacityDeficit).toBe(0);
    expect(result.transfers[0].payment).toBe(408); // 1223 / 3 = 408 (per child)
    expect(result.engineVersion).toBe("2.0.0");
  });
});
