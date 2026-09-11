import { describe, expect, it } from "vitest";
import { fingerprintCalculation } from "./calculation-engine-v2";

describe("case calculation v2 persistence contract", () => {
  it("creates a deterministic SHA-256 fingerprint for the full production result", () => {
    const input = { parents: [{ nbi: 3000 }, { nbi: 2500 }] };
    const result = { childSupportTotal: 450, combined: { totalMonthlyPayments: 450 } };
    const a = fingerprintCalculation(input, result, "2026.1");
    const b = fingerprintCalculation({ parents: [{ nbi: 3000 }, { nbi: 2500 }] }, result, "2026.1");
    expect(a.engineVersion).toBe("2.0.0");
    expect(a.contractVersion).toBe("2026.2");
    expect(a.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(a.resultHash).toMatch(/^[a-f0-9]{64}$/);
    expect(a).toEqual(b);
  });
});
