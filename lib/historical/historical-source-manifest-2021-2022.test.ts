import { describe, expect, it } from "vitest";
import { HISTORICAL_SOURCE_MANIFEST_2021_2022 } from "./historical-source-manifest-2021-2022";

describe("historical source manifest 2021-2022", () => {
  it("covers every 2021/2022 half-year", () => {
    expect(HISTORICAL_SOURCE_MANIFEST_2021_2022.map((p) => p.periodId)).toEqual([
      "2021-H1",
      "2021-H2",
      "2022-H1",
      "2022-H2",
    ]);
  });

  it("requires official report, need, capacity and appendix sources", () => {
    for (const period of HISTORICAL_SOURCE_MANIFEST_2021_2022) {
      expect(period.reportUrl).toMatch(/^https:\/\/www\.rechtspraak\.nl\//);
      expect(period.needTableUrl).toMatch(/^https:\/\/www\.rechtspraak\.nl\//);
      expect(period.capacityTableUrl).toMatch(/^https:\/\/www\.rechtspraak\.nl\//);
      expect(period.appendixUrls.length).toBeGreaterThan(0);
      expect(period.verified).toBe(false);
    }
  });
});
