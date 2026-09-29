import { describe, expect, it } from "vitest";
import { HISTORICAL_NORM_2023, HISTORICAL_NORM_2023_SOURCE } from "./historical-norms-2023";
import { isHistoricalNormParameterSetComplete } from "./historical-norm-parameter-registry";

const round = (value: number) => Math.round(value * 100) / 100;

describe("verified 2023 historical norm references", () => {
  it("has a complete verified parameter set", () => {
    expect(isHistoricalNormParameterSetComplete("2023")).toBe(true);
    expect(Object.values(HISTORICAL_NORM_2023.verification).every((status) => status === "verified")).toBe(true);
  });

  it("locks the official 2023 need-table anchors", () => {
    expect(HISTORICAL_NORM_2023.needTable[1]).toEqual([150, 190, 230, 310, 390, 470, 550, 630, 710, 790, 870]);
    expect(HISTORICAL_NORM_2023.needTable[2]).toEqual([235, 310, 380, 515, 650, 785, 920, 1055, 1190, 1325, 1460]);
    expect(HISTORICAL_NORM_2023.needTable[3][10]).toBe(1630);
    expect(HISTORICAL_NORM_2023.needTable[4][10]).toBe(1940);
  });

  it("locks the official 2023 capacity anchors", () => {
    expect(HISTORICAL_NORM_2023.capacity.underAow.formulaThreshold).toBe(1930);
    expect(HISTORICAL_NORM_2023.capacity.underAow.necessary).toBe(1175);
    expect(HISTORICAL_NORM_2023.capacity.underAow.low).toEqual([
      [1680, 51], [1730, 77], [1780, 97], [1830, 109], [1880, 116], [1930, 123],
    ]);
    expect(HISTORICAL_NORM_2023.capacity.aow.minimumNbi).toBe(1890);
  });

  it("locks the 2023 fiscal and ZVW anchors", () => {
    expect(round(HISTORICAL_NORM_2023.fiscal.maxDeductionRate * 100)).toBe(36.93);
    expect(round(HISTORICAL_NORM_2023.fiscal.aanmerkelijkBelangRate * 100)).toBe(26.9);
    expect(HISTORICAL_NORM_2023.fiscal.box3TaxFreeAsset).toBe(57000);
    expect(HISTORICAL_NORM_2023.social.zvwSelfPaidRate).toBe(0.0543);
    expect(HISTORICAL_NORM_2023.social.zvwEmployerRate).toBe(0.0668);
    expect(HISTORICAL_NORM_2023.social.zvwMaxContributionIncome).toBe(66956);
  });

  it("locks the January/July 2023 minimum-income anchors", () => {
    expect(HISTORICAL_NORM_2023.otherNormInputs.subsistenceBenefit.underAow.january).toEqual({ married: 1708, single: 1196 });
    expect(HISTORICAL_NORM_2023.otherNormInputs.subsistenceBenefit.underAow.july).toEqual({ married: 1738, single: 1217 });
    expect(HISTORICAL_NORM_2023.otherNormInputs.subsistenceBenefit.aow.january).toEqual({ married: 1807, single: 1331 });
    expect(HISTORICAL_NORM_2023.otherNormInputs.subsistenceBenefit.aow.july).toEqual({ married: 1844, single: 1358 });
  });

  it("keeps official provenance attached", () => {
    expect(HISTORICAL_NORM_2023_SOURCE.appendixJanuary).toMatch(/^https:\/\/www\.rechtspraak\.nl\//);
    expect(HISTORICAL_NORM_2023_SOURCE.appendixJuly).toMatch(/^https:\/\/www\.rechtspraak\.nl\//);
    expect(HISTORICAL_NORM_2023_SOURCE.needTable).toContain("behoeftetabel-2023");
    expect(HISTORICAL_NORM_2023_SOURCE.capacityTable).toContain("alimentatie-draagkrachttabel-2023");
  });
});
