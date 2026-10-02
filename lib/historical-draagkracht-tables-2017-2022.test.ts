import { describe, expect, it } from "vitest";
import {
  HISTORICAL_CAPACITY_TABLES_2017_2022,
  calculateHistoricalCapacity,
  getHistoricalCapacityTable,
} from "./historical-draagkracht-tables-2017-2022";

describe("historical capacity batch 2017-2022", () => {
  it("contains all six annual source tables", () => {
    expect(HISTORICAL_CAPACITY_TABLES_2017_2022.map((table) => table.year)).toEqual([
      2017, 2018, 2019, 2020, 2021, 2022,
    ]);
  });

  it("has official Rechtspraak provenance and complete fixed bands for every year", () => {
    for (const table of HISTORICAL_CAPACITY_TABLES_2017_2022) {
      expect(table.sourceUrl).toMatch(/^https:\/\/www\.rechtspraak\.nl\//);
      expect(table.bands.length).toBe(6);
      expect(table.fixedCapacityBands.at(-1)?.toNbi).toBe(table.formulaStartNbi);
    }
  });

  it("encodes the documented DKL offsets", () => {
    expect(getHistoricalCapacityTable(2017).bands.map((band) => band.fixedOffset)).toEqual([855, 855, 855, 855, 880, 905]);
    expect(getHistoricalCapacityTable(2018).bands.map((band) => band.fixedOffset)).toEqual([870, 870, 870, 870, 895, 920]);
    expect(getHistoricalCapacityTable(2019).bands.map((band) => band.fixedOffset)).toEqual([900, 900, 900, 900, 925, 950]);
    expect(getHistoricalCapacityTable(2020).bands.map((band) => band.fixedOffset)).toEqual([925, 925, 925, 925, 950, 975]);
    expect(getHistoricalCapacityTable(2021).bands.map((band) => band.fixedOffset)).toEqual([950, 950, 950, 950, 975, 1000]);
    expect(getHistoricalCapacityTable(2022).bands.map((band) => band.fixedOffset)).toEqual([970, 970, 970, 970, 995, 1020]);
  });

  it("uses the official fixed table amounts throughout the low-income bands", () => {
    const expected: Record<number, number[]> = {
      2017: [73, 97, 114, 124, 131],
      2018: [75, 99, 116, 126, 133],
      2019: [63, 88, 106, 117, 124],
      2020: [62, 87, 106, 117, 124],
      2021: [65, 90, 108, 119, 126],
      2022: [59, 85, 103, 115, 122],
    };

    for (const table of HISTORICAL_CAPACITY_TABLES_2017_2022) {
      expect(table.fixedCapacityBands.map((band) => band.capacity)).toEqual(expected[table.year]);
      for (const band of table.fixedCapacityBands) {
        expect(calculateHistoricalCapacity(table.year, band.fromNbi, 1)).toBe(band.capacity);
        expect(calculateHistoricalCapacity(table.year, band.toNbi - 1, 2)).toBe(band.capacity);
      }
    }
  });

  it("uses the minimum amount for one child or two or more children below the first threshold", () => {
    expect(calculateHistoricalCapacity(2017, 1200, 1)).toBe(25);
    expect(calculateHistoricalCapacity(2017, 1200, 2)).toBe(50);
    expect(calculateHistoricalCapacity(2022, 1400, 1)).toBe(25);
    expect(calculateHistoricalCapacity(2022, 1400, 4)).toBe(50);
  });

  it("switches from each final fixed amount to the formula at the published threshold", () => {
    const boundaries = [
      { year: 2017, threshold: 1550, fixed: 131, atThreshold: 144 },
      { year: 2018, threshold: 1600, fixed: 133, atThreshold: 140 },
      { year: 2019, threshold: 1625, fixed: 124, atThreshold: 131 },
      { year: 2020, threshold: 1660, fixed: 124, atThreshold: 131 },
      { year: 2021, threshold: 1700, fixed: 126, atThreshold: 133 },
      { year: 2022, threshold: 1720, fixed: 122, atThreshold: 129 },
    ] as const;

    for (const boundary of boundaries) {
      expect(calculateHistoricalCapacity(boundary.year, boundary.threshold - 1, 1)).toBe(boundary.fixed);
      expect(calculateHistoricalCapacity(boundary.year, boundary.threshold, 1)).toBe(boundary.atThreshold);
    }
  });

  it("fails closed for an unsupported year, invalid NBI, or invalid child count", () => {
    expect(() => getHistoricalCapacityTable(2026 as never)).toThrow(/REVIEW_REQUIRED/);
    expect(() => calculateHistoricalCapacity(2022, Number.NaN, 1)).toThrow(/REVIEW_REQUIRED/);
    expect(() => calculateHistoricalCapacity(2022, -1, 1)).toThrow(/REVIEW_REQUIRED/);
    expect(() => calculateHistoricalCapacity(2022, 1800, 0)).toThrow(/REVIEW_REQUIRED/);
    expect(() => calculateHistoricalCapacity(2022, 1800, 1.5)).toThrow(/REVIEW_REQUIRED/);
  });

  it("uses the formula instead of fixed amounts when additional costs apply", () => {
    expect(calculateHistoricalCapacity(2017, 1400, 1)).toBe(97);
    expect(calculateHistoricalCapacity(2017, 1400, 1, { hasAdditionalCosts: true })).toBe(113);
    expect(calculateHistoricalCapacity(2022, 1500, 2)).toBe(59);
    expect(calculateHistoricalCapacity(2022, 1500, 2, { hasAdditionalCosts: true })).toBe(80);
    expect(() =>
      calculateHistoricalCapacity(2017, 1200, 1, { hasAdditionalCosts: true }),
    ).toThrow(/REVIEW_REQUIRED/);
  });

  it("applies the 70% formula with the year-specific DKL offset for every year", () => {
    const expectedAtNbi2000: Record<number, number> = {
      2017: 347,
      2018: 336,
      2019: 315,
      2020: 298,
      2021: 280,
      2022: 266,
    };

    for (const table of HISTORICAL_CAPACITY_TABLES_2017_2022) {
      expect(calculateHistoricalCapacity(table.year, 2000, 1)).toBe(expectedAtNbi2000[table.year]);
    }
  });
});
