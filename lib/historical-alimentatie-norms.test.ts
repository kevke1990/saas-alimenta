import { describe, expect, it } from "vitest";
import {
  HISTORICAL_NORM_PERIODS,
  assertHistoricalNormExecutable,
  resolveHistoricalNormPeriod,
} from "./historical-alimentatie-norms";

describe("historical alimentatie norm registry", () => {
  it("covers the requested start year 2006 and current 2026 periods", () => {
    expect(HISTORICAL_NORM_PERIODS.some((period) => period.validFrom === "2006-01-01")).toBe(true);
    expect(HISTORICAL_NORM_PERIODS.some((period) => period.id === "2026-H1")).toBe(true);
    expect(HISTORICAL_NORM_PERIODS.some((period) => period.id === "2026-H2")).toBe(true);
  });

  it("has deterministic, non-overlapping periods", () => {
    const periods = [...HISTORICAL_NORM_PERIODS].sort((a, b) => a.validFrom.localeCompare(b.validFrom));
    for (let index = 1; index < periods.length; index += 1) {
      expect(periods[index - 1].validTo < periods[index].validFrom).toBe(true);
    }
  });

  it("resolves historical dates without silently falling back to 2026", () => {
    expect(resolveHistoricalNormPeriod("2008-08-01")?.id).toBe("2008");
    expect(resolveHistoricalNormPeriod("2015-08-01")?.id).toBe("2015-H2");
    expect(resolveHistoricalNormPeriod("2026-09-26")?.id).toBe("2026-H2");
    expect(resolveHistoricalNormPeriod("2011-06-30")).toBeNull();
  });

  it("rejects invalid calendar dates instead of normalizing them", () => {
    expect(resolveHistoricalNormPeriod("2026-02-31")).toBeNull();
    expect(resolveHistoricalNormPeriod("2026-2-01")).toBeNull();
    expect(resolveHistoricalNormPeriod("not-a-date")).toBeNull();
  });

  it("requires explicit parameter verification before a historical period is executable", () => {
    const period = resolveHistoricalNormPeriod("2006-06-01");
    expect(period).not.toBeNull();
    expect(period?.status).toBe("parameters-pending");
    expect(() => assertHistoricalNormExecutable(period!)).toThrow(/REVIEW_REQUIRED/);
  });

  it("allows the current 2026 period through the integrated execution gate", () => {
    const current = resolveHistoricalNormPeriod("2026-09-26");
    expect(current?.status).toBe("parameters-verified");
    expect(() => assertHistoricalNormExecutable(current!)).not.toThrow();
  });

  it("does not confuse source verification with executable parameters", () => {
    const historical = resolveHistoricalNormPeriod("2025-06-01");
    expect(historical?.status).toBe("parameters-pending");
    expect(() => assertHistoricalNormExecutable(historical!)).toThrow(/REVIEW_REQUIRED/);
  });

  it("keeps catalogued historical sources tied to official Rechtspraak provenance", () => {
    for (const period of HISTORICAL_NORM_PERIODS) {
      expect(period.sourceUrl).toMatch(/^https:\/\/www\.rechtspraak\.nl\//);
    }
  });
});
