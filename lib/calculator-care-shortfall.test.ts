import { describe, expect, it } from "vitest";
import { calculate } from "./calculator";

describe("2026 care-shortfall calculation", () => {
  it("deducts the rounded half of the capacity shortfall from the care discount", () => {
    // 2026 report example pattern: need €475, capacities €221 + €179 = €400,
    // shortfall €75, half €37.50 -> €38, care discount €71 -> €33.
    const result = calculate({
      historicalNBGI: 3717,
      parents: [
        { nbi: 2400, careDaysPerWeek: 0 },
        { nbi: 2315, careDaysPerWeek: 1 },
      ],
      children: [{ age: 10, residence: "A" }],
    });

    expect(result.totalNeed).toBe(475);
    expect(result.totalCapacity).toBe(400);
    expect(result.capacityDeficit).toBe(75);
    expect(result.transfers[0].grossShare).toBe(179);
    expect(result.transfers[0].careDiscount).toBe(33);
    expect(result.transfers[0].payment).toBe(146);
  });
});
