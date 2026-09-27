import { describe, expect, it } from "vitest";
import { calculateHistoricalFormulaCapacity, findHistoricalCapacityBand } from "./historical-alimentatie-tables";

// Historical 2015 audit: source-derived regression coverage.
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

  describe("2015 official Rechtspraak table", () => {
    const formula = (nbi: number, base: number) => Math.round(0.7 * (nbi - (0.3 * nbi + base)));

    it("uses the published non-AOW threshold and table boundary", () => {
      expect(findHistoricalCapacityBand(2015, 1524.99, false)?.capacityMonthly).toBe(127);
      expect(findHistoricalCapacityBand(2015, 1525, false)?.capacityMonthly).toBe(134);
      expect(findHistoricalCapacityBand(2015, 1525, false)?.source).toContain("draagkrachttabel-2015");
    });

    it("uses the published AOW threshold and table boundary", () => {
      expect(findHistoricalCapacityBand(2015, 1649.99, true)?.capacityMonthly).toBe(107);
      expect(findHistoricalCapacityBand(2015, 1650, true)?.capacityMonthly).toBe(114);
      expect(findHistoricalCapacityBand(2015, 1650, true)?.source).toContain("draagkrachttabel-2015");
    });

    it("uses the official 2015 formula parameters with central rounding for AOW", () => {
      for (const nbi of [1650, 1700, 1750, 1800, 2000, 2600]) {
        expect(calculateHistoricalFormulaCapacity(2015, nbi, true)).toBe(formula(nbi, 992));
      }
    });

    it("uses the official 2015 formula parameters with central rounding for non-AOW", () => {
      for (const nbi of [1525, 1575, 1625, 1675, 1725, 2600]) {
        expect(calculateHistoricalFormulaCapacity(2015, nbi, false)).toBe(formula(nbi, 875));
      }
    });

    it("keeps the printed low-NBI bands distinct from the formula", () => {
      const band = findHistoricalCapacityBand(2015, 1500, false);
      expect(band?.capacityMonthly).toBe(127);
      expect(calculateHistoricalFormulaCapacity(2015, 1500, false)).toBe(127);
    });
  });
});
