import { describe, expect, it } from "vitest";
import { HISTORICAL_NORM_2023, HISTORICAL_NORM_2023_SOURCE } from "./historical-norms-2023";

describe("historical 2023 norm inputs", () => {
  it("contains the official 2023 need table", () => {
    expect(HISTORICAL_NORM_2023.needIncomePoints).toEqual([1500, 1750, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000]);
    expect(HISTORICAL_NORM_2023.needTable[1]).toEqual([150, 190, 230, 310, 390, 470, 550, 630, 710, 790, 870]);
    expect(HISTORICAL_NORM_2023.needTable[4]).toEqual([280, 370, 460, 645, 830, 1015, 1200, 1385, 1570, 1755, 1940]);
  });

  it("contains the official 2023 capacity thresholds and table values", () => {
    expect(HISTORICAL_NORM_2023.capacity.underAow).toMatchObject({ minimumNbi: 1680, formulaThreshold: 1930, necessary: 1175, housingPct: 0.3 });
    expect(HISTORICAL_NORM_2023.capacity.aow).toMatchObject({ minimumNbi: 1890, formulaThreshold: 2090, necessary: 1315, housingPct: 0.3 });
    expect(HISTORICAL_NORM_2023.capacity.underAow.low).toEqual([[1680, 51], [1730, 77], [1780, 97], [1830, 109], [1880, 116], [1930, 123]]);
    expect(HISTORICAL_NORM_2023.capacity.aow.low).toEqual([[1890, 52], [1940, 74], [1990, 90], [2040, 97], [2090, 104]]);
  });

  it("uses the 2023 care-discount percentages", () => {
    expect(HISTORICAL_NORM_2023.careDiscount.map((rule) => rule.pct)).toEqual([0.05, 0.15, 0.25, 0.35]);
  });

  it("keeps WSF transition dates explicit", () => {
    expect(HISTORICAL_NORM_2023.wsfPeriods.map((period) => period.from)).toEqual(["2023-01-01", "2023-08-01", "2023-09-01"]);
    expect(HISTORICAL_NORM_2023.wsfPeriods.map((period) => period.mbo.tuition)).toEqual([103.25, 113.08, 113.08]);
    expect(HISTORICAL_NORM_2023.wsfPeriods.map((period) => period.hbo.tuition)).toEqual([184.08, 184.08, 192.83]);
  });

  it("marks all 2023 verification dimensions as verified", () => {
    expect(Object.values(HISTORICAL_NORM_2023.verification)).toEqual([
      "verified",
      "verified",
      "verified",
      "verified",
      "verified",
      "verified",
      "verified",
      "verified",
    ]);
  });

  it("uses official Rechtspraak sources", () => {
    for (const source of Object.values(HISTORICAL_NORM_2023_SOURCE)) {
      expect(source).toMatch(/^https:\/\/www\.rechtspraak\.nl\//);
    }
  });
});
