import { describe, expect, it } from "vitest";
import {
  calculatePartnerCapacity,
  explainPartnerCareObligations,
} from "./partner-capacity";

describe("partner capacity", () => {
  it("calculates capacity after needs, obligations and partner-child care costs", () => {
    const result = calculatePartnerCapacity({
      netMonthlyIncome: 3000,
      basicNeedMonthly: 1500,
      otherObligationsMonthly: 250,
      careObligations: [
        { id: "child-1", monthlyAmount: 400, included: true },
        { id: "child-2", monthlyAmount: 200, included: false },
      ],
    });

    expect(result.careObligationsMonthly).toBe(400);
    expect(result.availableCapacityMonthly).toBe(850);
    expect(result.allocatedCapacityMonthly).toBe(850);
  });

  it("supports an explicit zero-capacity scenario", () => {
    const result = calculatePartnerCapacity({
      mode: "ZERO_CAPACITY",
      netMonthlyIncome: 5000,
      basicNeedMonthly: 2000,
      careObligations: [{ id: "child-1", monthlyAmount: 900, included: true }],
    });

    expect(result.availableCapacityMonthly).toBe(0);
    expect(result.allocatedCapacityMonthly).toBe(0);
    expect(result.explanation[0]).toContain("0 draagkracht");
  });

  it("applies an allocation percentage", () => {
    const result = calculatePartnerCapacity({
      netMonthlyIncome: 3000,
      basicNeedMonthly: 1000,
      allocationPercentage: 25,
    });

    expect(result.availableCapacityMonthly).toBe(2000);
    expect(result.allocatedCapacityMonthly).toBe(500);
  });

  it("explains active care obligations", () => {
    expect(
      explainPartnerCareObligations([
        { id: "child-1", monthlyAmount: 300, included: true },
      ]).join(" "),
    ).toContain("1 actieve zorgverplichting");
  });
});
