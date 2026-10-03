import { describe, expect, it } from "vitest";
import {
  HISTORICAL_2012_CAPACITY_BASELINE,
  HISTORICAL_2012_CHILD_COST_TABLES,
  HISTORICAL_2012_CHILD_POINTS,
  HISTORICAL_2012_HEALTH,
  HISTORICAL_2012_INCOME_POINTS,
  HISTORICAL_2012_KGB,
  HISTORICAL_2012_SOURCE,
  HISTORICAL_2012_TAX,
  getHistorical2012ChildCostTable,
} from "./historical-2012-norm-data";

describe("verified 2012 historical norm data", () => {
  it("has official provenance for both 2012 half-year appendices", () => {
    expect(HISTORICAL_2012_SOURCE.januaryAppendix).toContain("rechtspraak.nl");
    expect(HISTORICAL_2012_SOURCE.julyAppendix).toContain("rechtspraak.nl");
    expect(HISTORICAL_2012_SOURCE.tableLocator).toContain("paragraaf 28");
  });

  it("contains the official income breakpoints", () => {
    expect(HISTORICAL_2012_INCOME_POINTS).toEqual([1250,1500,1750,2000,2500,3000,3500,4000,4500,5000]);
  });

  it("contains the official child point mappings", () => {
    expect(HISTORICAL_2012_CHILD_POINTS.one).toEqual([0,0,2,4]);
    expect(HISTORICAL_2012_CHILD_POINTS.two).toEqual([0,2,4,6]);
    expect(HISTORICAL_2012_CHILD_POINTS.three).toEqual([0,3,5,7]);
    expect(HISTORICAL_2012_CHILD_POINTS.four).toEqual([0,4,6,8]);
  });

  it("has a complete row for every published point value", () => {
    const expectedRows = { 1: 5, 2: 13, 3: 22, 4: 33 } as const;
    for (const [children, rowCount] of Object.entries(expectedRows)) {
      const rows = HISTORICAL_2012_CHILD_COST_TABLES[Number(children) as 1|2|3|4];
      expect(rows).toHaveLength(rowCount);
      for (const row of rows) expect(row).toHaveLength(11);
    }
  });

  it("preserves published 2012 reference values", () => {
    expect(HISTORICAL_2012_CHILD_COST_TABLES[1][0]).toEqual([4,155,195,240,280,365,450,535,620,705,790]);
    expect(HISTORICAL_2012_CHILD_COST_TABLES[2][12]).toEqual([0,170,235,300,365,495,625,755,885,1015,1145]);
    expect(HISTORICAL_2012_CHILD_COST_TABLES[4][32]).toEqual([0,220,320,420,520,720,920,1120,1320,1520,1720]);
  });

  it("contains January and July 2012 capacity baseline differences", () => {
    expect(HISTORICAL_2012_CAPACITY_BASELINE.january2012.assistanceNormMonthly.single).toBe(935);
    expect(HISTORICAL_2012_CAPACITY_BASELINE.july2012.assistanceNormMonthly.single).toBe(936);
    expect(HISTORICAL_2012_CAPACITY_BASELINE.january2012.capacityShare.single).toBe(0.7);
    expect(HISTORICAL_2012_CAPACITY_BASELINE.july2012.capacityShare.family).toBe(0.5);
  });

  it("contains the published 2012 tax brackets and credits", () => {
    expect(HISTORICAL_2012_TAX.box1[0]).toEqual({ max: 18945, rateUnder65: 0.331, rate65Plus: 0.152 });
    expect(HISTORICAL_2012_TAX.box1[3]).toEqual({ max: null, rateUnder65: 0.52, rate65Plus: 0.52 });
    expect(HISTORICAL_2012_TAX.box2Rate).toBe(0.25);
    expect(HISTORICAL_2012_TAX.box3Rate).toBe(0.30);
    expect(HISTORICAL_2012_TAX.box3ReturnRate).toBe(0.04);
    expect(HISTORICAL_2012_TAX.generalTaxCredit).toEqual({ under65: 2033, age65Plus: 934 });
  });

  it("contains the published 2012 KGB baseline", () => {
    expect(HISTORICAL_2012_KGB).toEqual({
      incomeThresholdFull: 28897,
      noRightFromIncome: 41880,
      baseByChildren: { 1: 1017, 2: 1478, 3: 1661 },
      additionalPerChildFromFourth: 106,
      ageIncrease12to15: 226,
      ageIncrease16to17: 290,
    });
  });

  it("contains the published 2012 health inputs", () => {
    expect(HISTORICAL_2012_HEALTH).toEqual({ mandatoryExcessAnnual: 220, nominalZvwIncludedMonthly: { single: 49, couple: 93 } });
  });

  it("uses the four-child table for five or more children", () => {
    expect(getHistorical2012ChildCostTable(5)).toBe(HISTORICAL_2012_CHILD_COST_TABLES[4]);
  });

  it("rejects zero or fractional child counts", () => {
    expect(() => getHistorical2012ChildCostTable(0)).toThrow();
    expect(() => getHistorical2012ChildCostTable(1.5)).toThrow();
  });
});
