import { describe, expect, it } from "vitest";
import { calculate, careDiscount } from "./calculator";
import { getNormSet } from "./norms";

describe("Alimenta calculation-engine audit regressions", () => {
  it("calculates care discount from the child's eigen aandeel, not the paying parent's allocated share", () => {
    const r = calculate({
      historicalNBGI: 5000,
      parents: [
        { nbi: 3350, careDaysPerWeek: 0 },
        { nbi: 2181, kgb: 716, careDaysPerWeek: 1 },
      ],
      children: [{ age: 10, residence: "A" }],
    });

    expect(r.totalNeed).toBe(680);
    expect(r.parentResults[0].capacity).toBe(686);
    expect(r.parentResults[1].capacity).toBe(464);
    expect(r.transfers[0].payerIndex).toBe(1);
    expect(r.transfers[0].careDiscount).toBe(102);
    expect(r.transfers[0].payment).toBe(172);
  });

  it("does not calculate care discount as 15% of the paying parent's own share", () => {
    expect(careDiscount(680, 1)).toBe(102);
    expect(careDiscount(464, 1)).not.toBe(69.6);
  });

  it("keeps 2024, 2025 and 2026 norm metadata separate", () => {
    expect(getNormSet(2024).capacity.underAow.necessary).toBe(1270);
    expect(getNormSet(2025).capacity.underAow.necessary).toBe(1310);
    expect(getNormSet(2026).capacity.underAow.necessary).toBe(1365);
    expect(getNormSet(2024).needTable[1][0]).toBe(150);
    expect(getNormSet(2025).needTable[1][0]).toBe(200);
    expect(getNormSet(2026).needTable[1][0]).toBe(200);
  });

  it("uses the selected norm year for both need and capacity", () => {
    const input = {
      historicalNBGI: 3000,
      parents: [
        { nbi: 2000, careDaysPerWeek: 0 },
        { nbi: 1000, careDaysPerWeek: 3 },
      ],
      children: [{ age: 10, residence: "A" as const }],
    };

    const r2024 = calculate({ ...input, normYear: 2024 });
    const r2026 = calculate({ ...input, normYear: 2026 });

    expect(r2024.normYear).toBe(2024);
    expect(r2026.normYear).toBe(2026);
    expect(r2024.normVersion).toBe("2024.1");
    expect(r2026.normVersion).toBe("2026.1");
    expect(r2024.parentResults.every(p => p.capacityNormYear === 2024)).toBe(true);
    expect(r2026.parentResults.every(p => p.capacityNormYear === 2026)).toBe(true);
    expect(r2024.totalNeed).not.toBe(r2026.totalNeed);
    expect(r2024.totalCapacity).not.toBe(r2026.totalCapacity);
  });
});
