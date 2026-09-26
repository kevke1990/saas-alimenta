import { describe, expect, it } from "vitest";
import { calculateHistoricalFormulaCapacity, findHistoricalCapacityBand } from "./historical-alimentatie-tables";

describe("historical alimentatie tables", () => {
  it("uses the official 2024 non-AOW bands", () => {
    expect(findHistoricalCapacityBand(2024, 2000, false)?.capacityMonthly).toBe(109);
    expect(calculateHistoricalFormulaCapacity(2024, 2600, false)).toBe(385);
  });

  it("uses the separate AOW table", () => {
    expect(findHistoricalCapacityBand(2024, 2100, true)?.capacityMonthly).toBe(73);
    expect(calculateHistoricalFormulaCapacity(2024, 2600, true)).toBe(284);
  });

  it("does not silently fall back to another year", () => {
    expect(findHistoricalCapacityBand(2023, 2000, false)).toBeUndefined();
    expect(calculateHistoricalFormulaCapacity(2023, 2600, false)).toBeUndefined();
  });
});
