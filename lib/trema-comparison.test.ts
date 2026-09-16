import { describe, expect, it } from "vitest";
import { compareLegacyWithTrema } from "./trema-comparison";

describe("compareLegacyWithTrema", () => {
  it("returns MATCH when the shared payable amount is equal", () => {
    const result = compareLegacyWithTrema(
      { payableMonthly: 250, maximumContributionMonthly: 300 },
      { payableMonthly: 250, maximumContributionMonthly: 999 },
    );

    expect(result.status).toBe("MATCH");
    expect(result.comparable).toBe(true);
    expect(result.comparedMetricCount).toBe(1);
    expect(result.missingMetricKeys).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.metrics[0]).toMatchObject({
      key: "payableMonthly",
      legacyMonthly: 250,
      tremaMonthly: 250,
      differenceMonthly: 0,
      comparable: true,
    });
  });

  it("returns DIFFERENCE and keeps the signed Trema-minus-legacy difference", () => {
    const result = compareLegacyWithTrema(
      { payableMonthly: 250 },
      { payableMonthly: 275 },
    );

    expect(result.status).toBe("DIFFERENCE");
    expect(result.comparable).toBe(true);
    expect(result.comparedMetricCount).toBe(1);
    expect(result.missingMetricKeys).toEqual([]);
    expect(result.metrics[0]).toMatchObject({
      key: "payableMonthly",
      legacyMonthly: 250,
      tremaMonthly: 275,
      differenceMonthly: 25,
      comparable: true,
    });
    expect(result.warnings).toContain("Het eindbedrag wijkt af tussen de legacy-berekening en de Trema-audit. De legacy-uitkomst blijft leidend.");
  });

  it("returns NOT_COMPARABLE when the shared payable amount is unavailable", () => {
    const result = compareLegacyWithTrema(
      { payable: "250" },
      { payableMonthly: null },
    );

    expect(result.status).toBe("NOT_COMPARABLE");
    expect(result.comparable).toBe(false);
    expect(result.comparedMetricCount).toBe(0);
    expect(result.missingMetricKeys).toEqual(["payableMonthly"]);
    expect(result.warnings[0]).toContain("geen gemeenschappelijk vergelijkbaar maandbedrag");
  });

  it("does not treat internal capacity fields as production differences", () => {
    const result = compareLegacyWithTrema(
      {
        payableMonthly: 250,
        maximumContributionMonthly: 300,
        payerCapacityMonthly: 400,
        recipientCapacityMonthly: 100,
      },
      {
        payableMonthly: 250,
        maximumContributionMonthly: 350,
        payerCapacityMonthly: 350,
        recipientCapacityMonthly: 120,
      },
    );

    expect(result.status).toBe("MATCH");
    expect(result.comparedMetricCount).toBe(1);
    expect(result.metrics).toHaveLength(1);
  });
});
