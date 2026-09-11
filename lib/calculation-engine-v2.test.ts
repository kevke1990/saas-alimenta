import { describe, expect, it } from "vitest";
import { CALCULATION_CONTRACT_VERSION, CALCULATION_ENGINE_V2, canonicalJson, fingerprintCalculation, roundMoney, sha256 } from "./calculation-engine-v2";

describe("calculation engine v2 contract", () => {
  it("canonicalizes object key order before hashing", () => {
    expect(canonicalJson({ b: 2, a: 1 })).toBe(canonicalJson({ a: 1, b: 2 }));
    expect(sha256({ b: 2, a: 1 })).toBe(sha256({ a: 1, b: 2 }));
  });

  it("requires a norm version and emits reproducible fingerprints", () => {
    const first = fingerprintCalculation({ income: 4000, children: 2 }, { payment: 850 }, "2026.1");
    const second = fingerprintCalculation({ children: 2, income: 4000 }, { payment: 850 }, "2026.1");
    expect(first).toEqual(second);
    expect(first.engineVersion).toBe(CALCULATION_ENGINE_V2);
    expect(first.contractVersion).toBe(CALCULATION_CONTRACT_VERSION);
    expect(first.inputHash).toHaveLength(64);
    expect(first.resultHash).toHaveLength(64);
    expect(() => fingerprintCalculation({}, {}, "")).toThrow();
  });

  it("rounds money deterministically to cents", () => {
    expect(roundMoney(12.345)).toBe(12.35);
    expect(roundMoney(12.344)).toBe(12.34);
    expect(() => roundMoney(Number.NaN)).toThrow();
  });
});
