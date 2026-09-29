import { describe, expect, it } from "vitest";
import { HISTORICAL_2017_2022_PERIODS, periodForCalculationDate } from "./historical-2017-2022-batch";

describe("2017-2022 historical batch coverage", () => {
  it("contains exactly the 12 required half-year periods", () => {
    expect(HISTORICAL_2017_2022_PERIODS.map((p) => p.id)).toEqual([
      "2017-H1", "2017-H2", "2018-H1", "2018-H2",
      "2019-H1", "2019-H2", "2020-H1", "2020-H2",
      "2021-H1", "2021-H2", "2022-H1", "2022-H2",
    ]);
  });

  it("has complete date boundaries without gaps or overlaps", () => {
    for (let i = 1; i < HISTORICAL_2017_2022_PERIODS.length; i += 1) {
      const previous = HISTORICAL_2017_2022_PERIODS[i - 1];
      const current = HISTORICAL_2017_2022_PERIODS[i];
      const nextDay = new Date(`${previous.end}T00:00:00Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      expect(current.start).toBe(nextDay.toISOString().slice(0, 10));
    }
  });

  it("maps boundary dates to the correct half-year", () => {
    expect(periodForCalculationDate("2017-01-01")?.id).toBe("2017-H1");
    expect(periodForCalculationDate("2017-06-30")?.id).toBe("2017-H1");
    expect(periodForCalculationDate("2017-07-01")?.id).toBe("2017-H2");
    expect(periodForCalculationDate("2022-06-30")?.id).toBe("2022-H1");
    expect(periodForCalculationDate("2022-07-01")?.id).toBe("2022-H2");
    expect(periodForCalculationDate("2022-12-31")?.id).toBe("2022-H2");
  });

  it("keeps every period linked to the official Rechtspraak source page", () => {
    for (const period of HISTORICAL_2017_2022_PERIODS) {
      expect(period.sourcePage).toContain("rechtspraak.nl");
      expect(period.requiredArtifacts).toHaveLength(5);
    }
  });
});
