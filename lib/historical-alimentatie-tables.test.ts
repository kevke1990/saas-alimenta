import { describe, expect, it } from "vitest";
import { calculateHistoricalFormulaCapacity, findHistoricalCapacityBand } from "./historical-alimentatie-tables";

describe("historical alimentatie tables", () => {
  it.each([
    [2020, 1660, false, 131],
    [2021, 1650, false, 126],
    [2022, 1670, false, 122],
    [2023, 1880, false, 116],
    [2024, 2000, false, 109],
  ])("uses the official non-AOW table for %s", (year, nbi, aow, expected) => {
    expect(findHistoricalCapacityBand(year, nbi, aow)?.capacityMonthly).toBe(expected);
  });

  it.each([
    [2020, 1750, 105],
    [2021, 1775, 103],
    [2022, 1795, 99],
    [2023, 2040, 97],
    [2024, 2100, 73],
  ])("uses the separate AOW table for %s", (year, nbi, expected) => {
    expect(findHistoricalCapacityBand(year, nbi, true)?.capacityMonthly).toBe(expected);
  });

  it("uses each year's own formula above the final table band", () => {
    expect(calculateHistoricalFormulaCapacity(2020, 2600, false)).toBe(592);
    expect(calculateHistoricalFormulaCapacity(2021, 2600, false)).toBe(574);
    expect(calculateHistoricalFormulaCapacity(2022, 2600, false)).toBe(560);
    expect(calculateHistoricalFormulaCapacity(2023, 2600, false)).toBe(451);
    expect(calculateHistoricalFormulaCapacity(2024, 2600, false)).toBe(385);
  });

  it("does not silently fall back to another year", () => {
    expect(findHistoricalCapacityBand(2019, 2000, false)).toBeUndefined();
    expect(calculateHistoricalFormulaCapacity(2019, 2600, false)).toBeUndefined();
  });
});
