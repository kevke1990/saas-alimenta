import { describe, expect, it } from "vitest";
import { runCalculationEngineV2 } from "../lib/calculation-pipeline-v2";

describe("Familie Geers - VD Bersselaar (Productie 8 Pariteit)", () => {
  it("berekent exact € 1.223 totale alimentatie (€ 408 per kind) en € 1.428 draagkracht Pedro conform Split-Online", () => {
    // Dossier-invoer zoals opgeslagen in Merelo vanuit de UI
    const input: any = {
      calculationDate: "2026-04-29",
      historicalNBGI: 4314, // 2024 NBGI uit Splitonline
      historicalPeriod: { calculationDate: "2024-07-01", kgbIncluded: true },
      parents: [
        {
          name: "Dianne",
          nbi: 935,
          kgb: 298,
          careDaysPerWeek: 7,
          housing: { type: "RENT", monthlyCosts: 267 }
        },
        {
          name: "Pedro",
          nbi: 3605,
          kgb: 0,
          careDaysPerWeek: 0,
          housing: { type: "OTHER", monthlyCosts: 200 }
        }
      ],
      children: [
        { name: "Jaivey", age: 2, residence: "A" },
        { name: "Jezley", age: 6, residence: "A" },
        { name: "Djelena", age: 9, residence: "A" }
      ]
    };

    const calculation = runCalculationEngineV2(input, "2026.1");
    const result = calculation.result as any;

    // 1. Totale behoefte geïndexeerd van 2024 naar 2026
    expect(result.totalNeed).toBe(1223);

    // 2. Pedro draagkracht: 70% van (3.605 - 1.365 - 200) = 70% van 2.040 = 1.428
    expect(result.parentResults[1].capacity).toBe(1428);

    // 3. Dianne draagkracht: (935 + 298) - 1.315 - 267 < 0 -> 0
    expect(result.parentResults[0].capacity).toBe(0);

    // 4. Totale gezamenlijke draagkracht dekt de volledige behoefte (geen tekort)
    expect(result.totalCapacity).toBe(1428);
    expect(result.capacityDeficit).toBe(0);
    expect(result.capacitySufficient).toBe(true);

    // 5. Pedro betaalt 100% van de behoefte (€ 408 per kind)
    expect(result.transfers[0].payment).toBe(408);
    expect(result.transfers[1].payment).toBe(408);
    expect(result.transfers[2].payment).toBe(407); // 1223 totaal (408 + 408 + 407)
    expect(result.transfers[0].direction).toBe("B->A");

    // 6. Totaal te betalen door Pedro
    const totalPayments = result.transfers.reduce((sum: number, t: any) => sum + t.payment, 0);
    expect(totalPayments).toBe(1223);
  });
});
