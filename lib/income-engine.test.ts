import { describe, expect, it } from "vitest";
import { calculateIncome } from "./income-engine";

describe("2026 income engine", () => {
  it("annualises gross salary, holiday allowance, IKB and pension and returns auditable NBI", () => {
    const r = calculateIncome({ mode: "GROSS", salaryMonthly: 3800, holidayAllowancePct: 8, ikbMonthly: 600, pensionMonthly: 250 });
    expect(r.grossAnnual).toBe(57024);
    expect(r.pensionAnnual).toBe(3000);
    expect(r.taxableBox1).toBe(54024);
    expect(r.nbiMonthly).toBeGreaterThan(2500);
    expect(r.components.length).toBeGreaterThan(5);
  });
  it("supports the net model without silently adding tax calculations", () => {
    const r = calculateIncome({ mode: "NET", netIncomeMonthly: 2500, kgbMonthly: 300 });
    expect(r.nbiMonthly).toBe(2800);
    expect(r.taxBeforeCredits).toBe(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
