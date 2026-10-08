import { describe, expect, it } from "vitest";
import { adaptAlimentaForm } from "../lib/alimentatie-engine-adapter";

describe("2026 Adapter Input Mapping Tests", () => {
  it("processes a standard 2026 child support case correctly", () => {
    // Note: this uses the adapter to ensure the inputs map correctly to the 2026 Trema engine format.
    const payload = {
      calculationDate: "2026-06-15",
      referenceYear: 2026,
      need: { ownShareMonthly: 500 },
      children: [
        { id: "c1", birthDate: "2015-01-01", careDiscountPercent: 15, specialCosts: 0, ownIncome: 0 }
      ],
      payer: { income: { netIncomeMonthly: 3000 } },
      recipient: { income: { netIncomeMonthly: 2000 } }
    };

    const adapted = adaptAlimentaForm(payload as any);
    expect(adapted.referenceYear).toBe(2026);
    // Explicitly provided ownShareMonthly is prioritized
    expect(adapted.need.ownShareMonthly).toBe(500);
    expect(adapted.payer.capacity.income.monthlyNbi).toBe(3000);
    expect(adapted.recipient.capacity.income.monthlyNbi).toBe(2000);
  });

  it("processes a standard 2026 child support case from basic children costs", () => {
    const payload = {
      calculationDate: "2026-06-15",
      referenceYear: 2026,
      children: [
        { id: "c1", birthDate: "2015-01-01", careDiscountPercent: 15, specialCosts: 300, ownIncome: 50 }
      ],
      payer: { income: { netIncomeMonthly: 3000 } },
      recipient: { income: { netIncomeMonthly: 2000 } }
    };

    const adapted = adaptAlimentaForm(payload as any);
    expect(adapted.referenceYear).toBe(2026);
    // Calculated from children: 300 (costs) - 50 (income) = 250
    expect(adapted.need.ownShareMonthly).toBe(250);
  });

  it("throws an error if own share is zero or less", () => {
    const payload = {
      calculationDate: "2026-06-15",
      referenceYear: 2026,
      need: { ownShareMonthly: 0 },
      children: [],
      payer: { income: { netIncomeMonthly: 3000 } },
      recipient: { income: { netIncomeMonthly: 2000 } }
    };

    expect(() => adaptAlimentaForm(payload as any)).toThrow("Het eigen aandeel/behoefte moet groter zijn dan nul.");
  });
});
