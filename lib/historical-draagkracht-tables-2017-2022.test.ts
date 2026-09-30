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

  it("has official Rechtspraak provenance for every year", () => {
    for (const table of HISTORICAL_CAPACITY_TABLES_2017_2022) {
      expect(table.sourceUrl).toMatch(/^https:\/\/www\.rechtspraak\.nl\//);
      expect(table.bands.length).toBe(6);
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

  it("fails closed for an unsupported year", () => {
    expect(() => getHistoricalCapacityTable(2026 as never)).toThrow(/REVIEW_REQUIRED/);
  });

  it("fails closed for an invalid NBI", () => {
    expect(() => calculateHistoricalCapacity(2022, Number.NaN)).toThrow(/REVIEW_REQUIRED/);
    expect(() => calculateHistoricalCapacity(2022, -1)).toThrow(/REVIEW_REQUIRED/);
  });

  it("keeps minimum capacity below the published minimum-NBI threshold", () => {
    expect(calculateHistoricalCapacity(2017, 1200)).toBe(25);
    expect(calculateHistoricalCapacity(2022, 1400)).toBe(25);
  });

  it("applies the 70% formula with the year-specific DKL offset", () => {
    expect(calculateHistoricalCapacity(2018, 2000)).toBe(336);
    expect(calculateHistoricalCapacity(2020, 2000)).toBe(298);
    expect(calculateHistoricalCapacity(2022, 2000)).toBe(266);
  });
});
