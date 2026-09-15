import { describe, expect, it } from "vitest";
import { compareLegacyWithTrema } from "./trema-comparison";

describe("compareLegacyWithTrema", () => {
  it("returns MATCH when all shared monthly values are equal", () => {
    const result = compareLegacyWithTrema(
      {
        payableMonthly: 250,
        maximumContributionMonthly: 300,
        payerCapacityMonthly: 400,
        recipientCapacityMonthly: 100,
      },
      {
        payableMonthly: 250,
        maximumContributionMonthly: 300,
        payerCapacityMonthly: 400,
        recipientCapacityMonthly: 100,
      },
    );

    expect(result.status).toBe("MATCH");
    expect(result.comparable).toBe(true);
    expect(result.comparedMetricCount).toBe(4);
    expect(result.missingMetricKeys).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.metrics.every((metric) => metric.differenceMonthly === 0)).toBe(true);
  });

  it("returns DIFFERENCE and keeps the signed Trema-minus-legacy difference", () => {
    const result = compareLegacyWithTrema(
      { payableMonthly: 250 },
      { payableMonthly: 275 },
    );

    expect(result.status).toBe("DIFFERENCE");
    expect(result.comparable).toBe(true);
    expect(result.comparedMetricCount).toBe(1);
    expect(result.missingMetricKeys).toEqual([
      "maximumContributionMonthly",
      "payerCapacityMonthly",
      "recipientCapacityMonthly",
    ]);
    expect(result.metrics[0]).toMatchObject({
      key: "payableMonthly",
      legacyMonthly: 250,
      tremaMonthly: 275,
      differenceMonthly: 25,
    });
    expect(result.warnings).toContain("Niet alle vergelijkingsvelden zijn beschikbaar; 3 veld(en) konden niet worden vergeleken.");
    expect(result.warnings).toContain("Er is een afwijking tussen de legacy-uitkomst en de Trema-audituitkomst. De legacy-uitkomst blijft leidend.");
  });

  it("returns NOT_COMPARABLE when no shared numeric monthly value exists", () => {
    const result = compareLegacyWithTrema(
      { payable: "250" },
      { payableMonthly: null },
    );

    expect(result.status).toBe("NOT_COMPARABLE");
    expect(result.comparable).toBe(false);
    expect(result.comparedMetricCount).toBe(0);
    expect(result.missingMetricKeys).toEqual([
      "payableMonthly",
      "maximumContributionMonthly",
      "payerCapacityMonthly",
      "recipientCapacityMonthly",
    ]);
    expect(result.warnings[0]).toContain("geen gemeenschappelijk vergelijkbaar maandbedrag");
  });

  it("ignores non-numeric fields and still compares available shared metrics", () => {
    const result = compareLegacyWithTrema(
      { payableMonthly: 250, engine: "legacy", note: "ok" },
      { payableMonthly: 250, engineVersion: "trema", note: "audit" },
    );

    expect(result.status).toBe("MATCH");
    expect(result.comparedMetricCount).toBe(1);
    expect(result.missingMetricKeys).toEqual([
      "maximumContributionMonthly",
      "payerCapacityMonthly",
      "recipientCapacityMonthly",
    ]);
    expect(result.warnings).toContain("Niet alle vergelijkingsvelden zijn beschikbaar; 3 veld(en) konden niet worden vergeleken.");
    expect(result.metrics.find((metric) => metric.key === "payableMonthly"))
      .toMatchObject({ legacyMonthly: 250, tremaMonthly: 250, differenceMonthly: 0 });
  });
});
