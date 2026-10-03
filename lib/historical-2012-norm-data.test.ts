import { describe, expect, it } from "vitest";
import {
  HISTORICAL_2012_CAPACITY_BASELINE,
  HISTORICAL_2012_CHILD_COST_TABLES,
  HISTORICAL_2012_CHILD_POINTS,
  HISTORICAL_2012_INCOME_POINTS,
  HISTORICAL_2012_SOURCE,
  getHistorical2012ChildCostTable,
} from "./historical-2012-norm-data";

describe("verified 2012 historical norm data", () => {
  it("has official provenance for both 2012 half-year appendices", () => {
    expect(HISTORICAL_2012_SOURCE.januaryAppendix).toContain("rechtspraak.nl");
    expect(HISTORICAL_2012_SOURCE.julyAppendix).toContain("rechtspraak.nl");
    expect(HISTORICAL_2012_SOURCE.tableLocator).toContain("paragraaf 28");
  });

  it("contains the official income breakpoints", () => {
    expect(HISTORICAL_2012_INCOME_POINTS).toEqual([1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 4500, 5000]);
  });

  it("contains the official child point mappings", () => {
    expect(HISTORICAL_2012_CHILD_POINTS.one).toEqual([0, 0, 2, 4]);
    expect(HISTORICAL_2012_CHILD_POINTS.two).toEqual([0, 2, 4, 6]);
    expect(HISTORICAL_2012_CHILD_POINTS.three).toEqual([0, 3, 5, 7]);
    expect(HISTORICAL_2012_CHILD_POINTS.four).toEqual([0, 4, 6, 8]);
  });

  it("has a complete row for every published point value", () => {
    const expectedRows = { 1: 5, 2: 13, 3: 22, 4: 33 } as const;
    for (const [children, rowCount] of Object.entries(expectedRows)) {
      const rows = HISTORICAL_2012_CHILD_COST_TABLES[Number(children) as 1 | 2 | 3 | 4];
      expect(rows).toHaveLength(rowCount);
      for (const row of rows) expect(row).toHaveLength(11);
    }
  });

  it("preserves the published 2012 reference values", () => {
    expect(HISTORICAL_2012_CHILD_COST_TABLES[1][0]).toEqual([4, 155, 195, 240, 280, 365, 450, 535, 620, 705, 790]);
    expect(HISTORICAL_2012_CHILD_COST_TABLES[2][12]).toEqual([0, 170, 235, 300, 365, 495, 625, 755, 885, 1015, 1145]);
    expect(HISTORICAL_2012_CHILD_COST_TABLES[4][32]).toEqual([0, 220, 320, 420, 520, 720, 920, 1120, 1320, 1520, 1720]);
  });

  it("contains the January and July 2012 capacity baseline differences", () => {
    expect(HISTORICAL_2012_CAPACITY_BASELINE.january2012.assistanceNormMonthly.single).toBe(935);
    expect(HISTORICAL_2012_CAPACITY_BASELINE.july2012.assistanceNormMonthly.single).toBe(936);
    expect(HISTORICAL_2012_CAPACITY_BASELINE.january2012.capacityShare.single).toBe(0.7);
    expect(HISTORICAL_2012_CAPACITY_BASELINE.july2012.capacityShare.family).toBe(0.5);
  });

  it("uses the four-child table for five or more children", () => {
    expect(getHistorical2012ChildCostTable(5)).toBe(HISTORICAL_2012_CHILD_COST_TABLES[4]);
  });

  it("rejects zero or fractional child counts", () => {
    expect(() => getHistorical2012ChildCostTable(0)).toThrow();
    expect(() => getHistorical2012ChildCostTable(1.5)).toThrow();
  });
});
