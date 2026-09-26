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

  it("resolves a historical date to its period without falling back to 2026", () => {
    expect(resolveHistoricalNormPeriod("2008-08-01")?.id).toBe("2008");
    expect(resolveHistoricalNormPeriod("2015-08-01")?.id).toBe("2015-H2");
    expect(resolveHistoricalNormPeriod("2026-09-26")?.id).toBe("2026-H2");
  });

  it("requires explicit verification before a historical period is executable", () => {
    const period = resolveHistoricalNormPeriod("2006-06-01");
    expect(period).not.toBeNull();
    expect(() => assertHistoricalNormExecutable(period!)).toThrow(/REVIEW_REQUIRED/);
  });

  it("does not invent financial parameters for periods that are only catalogued", () => {
    const period = resolveHistoricalNormPeriod("2009-06-01");
    expect(period?.status).toBe("verified-source");
    expect(period?.sourceUrl).toMatch(/^https:\/\/www\.rechtspraak\.nl\//);
  });
});
