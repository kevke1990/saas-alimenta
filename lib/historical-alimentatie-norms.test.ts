import { describe, expect, it } from "vitest";
import {
  HISTORICAL_NORM_PERIODS,
  assertHistoricalNormExecutable,
  resolveHistoricalNormPeriod,
} from "./historical-alimentatie-norms";

describe("historical alimentatie norm registry", () => {
  it("covers the requested start year 2006 and current 2026 periods", () => {
    expect(HISTORICAL_NORM_PERIODS.some((period) => period.id === "2006-H1" && period.validFrom === "2006-01-01")).toBe(true);
    expect(HISTORICAL_NORM_PERIODS.some((period) => period.id === "2006-H2" && period.validFrom === "2006-07-01")).toBe(true);
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
    expect(resolveHistoricalNormPeriod("2006-06-30")?.id).toBe("2006-H1");
    expect(resolveHistoricalNormPeriod("2006-07-01")?.id).toBe("2006-H2");
    expect(resolveHistoricalNormPeriod("2007-06-30")?.id).toBe("2007-H1");
    expect(resolveHistoricalNormPeriod("2007-07-01")?.id).toBe("2007-H2");
    expect(resolveHistoricalNormPeriod("2008-06-30")?.id).toBe("2008-H1");
    expect(resolveHistoricalNormPeriod("2008-07-01")?.id).toBe("2008-H2");
    expect(resolveHistoricalNormPeriod("2009-06-30")?.id).toBe("2009-H1");
    expect(resolveHistoricalNormPeriod("2009-07-01")?.id).toBe("2009-H2");
    expect(resolveHistoricalNormPeriod("2010-06-30")?.id).toBe("2010-H1");
    expect(resolveHistoricalNormPeriod("2010-07-01")?.id).toBe("2010-H2");
    for (const year of [2018, 2019, 2021, 2022, 2023, 2024, 2025]) {
      expect(resolveHistoricalNormPeriod(`${year}-06-30`)?.id).toBe(`${year}-H1`);
      expect(resolveHistoricalNormPeriod(`${year}-07-01`)?.id).toBe(`${year}-H2`);
    }
    expect(resolveHistoricalNormPeriod("2013-03-31")?.id).toBe("2013-H1");
    expect(resolveHistoricalNormPeriod("2013-04-01")?.id).toBe("2013-APR");
    expect(resolveHistoricalNormPeriod("2013-06-30")?.id).toBe("2013-APR");
    expect(resolveHistoricalNormPeriod("2013-07-01")?.id).toBe("2013-H2");
    expect(resolveHistoricalNormPeriod("2015-08-01")?.id).toBe("2015-H2");
    expect(resolveHistoricalNormPeriod("2026-09-26")?.id).toBe("2026-H2");
    expect(resolveHistoricalNormPeriod("2011-06-30")?.id).toBe("2011-H1");
    expect(resolveHistoricalNormPeriod("2011-07-01")?.id).toBe("2011-H2");
  });

  it("keeps the 2007 half-year periods non-executable until their full parameter sets are verified", () => {
    for (const date of ["2007-01-01", "2007-06-30", "2007-07-01", "2007-12-31"]) {
      const period = resolveHistoricalNormPeriod(date);
      expect(period?.id).toMatch(/^2007-H[12]$/);
      expect(period?.status).toBe("parameters-pending");
      expect(() => assertHistoricalNormExecutable(period!)).toThrow(/REVIEW_REQUIRED/);
    }
  });

  it("routes the unresolved 2011 first half to review instead of leaving a silent coverage gap", () => {
    const period = resolveHistoricalNormPeriod("2011-06-30");
    expect(period?.status).toBe("parameters-pending");
    expect(period?.notes).toMatch(/locate the January 2011 source/);
    expect(() => assertHistoricalNormExecutable(period!)).toThrow(/REVIEW_REQUIRED/);
  });

  it("keeps newly split 2018-2023 periods pending until period-specific data are verified", () => {
    for (const date of ["2018-01-01", "2018-07-01", "2019-01-01", "2019-07-01", "2021-01-01", "2021-07-01", "2022-01-01", "2022-07-01", "2023-01-01", "2023-07-01"]) {
      const period = resolveHistoricalNormPeriod(date);
      expect(period?.status).toBe("parameters-pending");
      expect(() => assertHistoricalNormExecutable(period!)).toThrow(/REVIEW_REQUIRED/);
    }
  });

  it("keeps the April 2013 calculation-method transition distinct and pending", () => {
    const january = resolveHistoricalNormPeriod("2013-03-31");
    const april = resolveHistoricalNormPeriod("2013-04-01");
    expect(january?.status).toBe("parameters-pending");
    expect(april?.status).toBe("parameters-pending");
    expect(april?.notes).toMatch(/1 April 2013/);
    expect(() => assertHistoricalNormExecutable(april!)).toThrow(/REVIEW_REQUIRED/);
  });

  it("rejects invalid calendar dates instead of normalizing them", () => {
    expect(resolveHistoricalNormPeriod("2026-02-31")).toBeNull();
    expect(resolveHistoricalNormPeriod("2026-2-01")).toBeNull();
    expect(resolveHistoricalNormPeriod("not-a-date")).toBeNull();
  });

  it("keeps both 2006 half-years blocked until every required parameter is verified", () => {
    for (const [date, expectedId] of [
      ["2006-01-01", "2006-H1"],
      ["2006-06-30", "2006-H1"],
      ["2006-07-01", "2006-H2"],
      ["2006-12-31", "2006-H2"],
    ]) {
      const period = resolveHistoricalNormPeriod(date);
      expect(period?.id).toBe(expectedId);
      expect(period?.status).toBe("parameters-pending");
      expect(() => assertHistoricalNormExecutable(period!)).toThrow(/REVIEW_REQUIRED/);
    }
  });

  it("allows the current 2026 period through the integrated execution gate", () => {
    const current = resolveHistoricalNormPeriod("2026-09-26");
    expect(current?.status).toBe("parameters-verified");
    expect(() => assertHistoricalNormExecutable(current!)).not.toThrow();
  });

  it("treats the existing 2025 norm set as executable", () => {
    const current = resolveHistoricalNormPeriod("2025-06-01");
    expect(current?.status).toBe("parameters-verified");
    expect(() => assertHistoricalNormExecutable(current!)).not.toThrow();
  });

  it("keeps catalogued historical sources tied to official Rechtspraak provenance", () => {
    for (const period of HISTORICAL_NORM_PERIODS) {
      expect(period.sourceUrl).toMatch(/^https:\/\/www\.rechtspraak\.nl\//);
    }
  });
});
