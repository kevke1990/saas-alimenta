import { describe, expect, it } from "vitest";
import {
  HISTORICAL_CAPACITY_2013_2016,
  calculateHistoricalCapacity,
  getHistoricalCapacityParameters,
} from "./historical-2013-2016-verified-capacity";

describe("historical 2013-2016 capacity parameters", () => {
  it("contains the four verified annual parameter sets", () => {
    expect(HISTORICAL_CAPACITY_2013_2016.map((p) => p.year)).toEqual([2013, 2014, 2015, 2016]);
  });

  it("switches to the new 2013 method on 1 April", () => {
    expect(getHistoricalCapacityParameters("2013-03-31")).toBeNull();
    expect(getHistoricalCapacityParameters("2013-04-01")?.year).toBe(2013);
    expect(getHistoricalCapacityParameters("2013-12-31")?.year).toBe(2013);
  });

  it("selects the correct annual regime", () => {
    expect(getHistoricalCapacityParameters("2014-06-30")?.year).toBe(2014);
    expect(getHistoricalCapacityParameters("2015-06-30")?.year).toBe(2015);
    expect(getHistoricalCapacityParameters("2016-12-31")?.year).toBe(2016);
  });

  it("uses the published 2015 formula at the formula start", () => {
    const parameters = getHistoricalCapacityParameters("2015-01-01");
    expect(parameters).not.toBeNull();
    expect(parameters?.formulaStartNbi).toBe(1525);
    expect(calculateHistoricalCapacity(2321, parameters!)).toBe(521);
  });

  it("uses the published 2016 formula parameters", () => {
    const parameters = getHistoricalCapacityParameters("2016-01-01");
    expect(parameters).not.toBeNull();
    expect(parameters?.bands.at(-1)).toEqual({ fromNbi: 1550, percentage: 70, dklFixed: 890 });
    expect(calculateHistoricalCapacity(2000, parameters!)).toBe(357);
  });

  it("fails closed below the minimum NBI", () => {
    const parameters = getHistoricalCapacityParameters("2016-01-01");
    expect(calculateHistoricalCapacity(1299, parameters!)).toBeNull();
  });
});
