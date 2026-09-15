import { describe, expect, it } from "vitest";
import { normalizeLegacyResultForTrema } from "./trema-legacy-normalizer";

describe("normalizeLegacyResultForTrema", () => {
  it("maps the legacy production result to Trema comparison fields", () => {
    const result = normalizeLegacyResultForTrema({
      totalNeed: 500,
      totalCapacity: 650,
      parentResults: [{ capacity: 400 }, { capacity: 250 }],
      transfers: [{ payment: 225 }, { payment: 25 }],
    });

    expect(result).toEqual({
      payableMonthly: 250,
      maximumContributionMonthly: 500,
      payerCapacityMonthly: 400,
      recipientCapacityMonthly: 250,
    });
  });

  it("uses total need when legacy capacity is the limiting factor", () => {
    const result = normalizeLegacyResultForTrema({
      totalNeed: 500,
      totalCapacity: 300,
      parentResults: [{ capacity: 200 }, { capacity: 100 }],
      transfers: [{ payment: 150 }],
    });

    expect(result?.maximumContributionMonthly).toBe(300);
  });

  it("returns null when required legacy fields are unavailable", () => {
    expect(normalizeLegacyResultForTrema({ totalNeed: 500 })).toBeNull();
  });

  it("does not allow negative numeric outputs", () => {
    const result = normalizeLegacyResultForTrema({
      totalNeed: -100,
      totalCapacity: -20,
      parentResults: [{ capacity: -10 }, { capacity: -5 }],
      transfers: [{ payment: -50 }],
    });

    expect(result).toEqual({
      payableMonthly: 0,
      maximumContributionMonthly: 0,
      payerCapacityMonthly: 0,
      recipientCapacityMonthly: 0,
    });
  });
});
