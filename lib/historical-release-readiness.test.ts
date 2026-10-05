import { describe, expect, it } from "vitest";
import {
  assertHistoricalReleaseReady,
  isHistoricalPeriodReleaseReady,
  REQUIRED_HISTORICAL_COVERAGE,
  type HistoricalPeriodStatus,
} from "./historical-release-readiness";

describe("historical release readiness", () => {
  it("requires every verification dimension before a period is executable", () => {
    const complete: HistoricalPeriodStatus = {
      period: "2023-01-01/2023-06-30",
      parametersVerified: true,
      rulesVerified: true,
      provenanceVerified: true,
      referenceCasesVerified: true,
    };

    expect(isHistoricalPeriodReleaseReady(complete)).toBe(true);
    expect(
      isHistoricalPeriodReleaseReady({ ...complete, referenceCasesVerified: false }),
    ).toBe(false);
    expect(
      isHistoricalPeriodReleaseReady({ ...complete, parametersVerified: false }),
    ).toBe(false);
  });

  it("fails closed when any historical period is incomplete", () => {
    const incomplete: HistoricalPeriodStatus = {
      period: "2023-07-01/2023-12-31",
      parametersVerified: false,
      rulesVerified: true,
      provenanceVerified: true,
      referenceCasesVerified: true,
    };

    expect(() => assertHistoricalReleaseReady([incomplete])).toThrow(
      "Historical release blocked: 2023-07-01/2023-12-31",
    );
  });

  it("keeps the required historical coverage explicit", () => {
    expect(REQUIRED_HISTORICAL_COVERAGE).toContain("2006-01-01/2006-06-30");
    expect(REQUIRED_HISTORICAL_COVERAGE).toContain("2006-07-01/2006-12-31");
    expect(REQUIRED_HISTORICAL_COVERAGE).not.toContain("2006-01-01/2006-12-31");
    expect(REQUIRED_HISTORICAL_COVERAGE).toContain("2013-04-01/2013-06-30");
    expect(REQUIRED_HISTORICAL_COVERAGE).toContain("2023-07-01/2023-12-31");
  });
});
