import { describe, expect, it } from "vitest";
import { HISTORICAL_2013_2016_PERIODS, resolveHistorical2013_2016 } from "./historical-2013-2016-batch";

describe("historical batch 2013-2016", () => {
  it("covers the 2013 transition and all 2014-2016 half-years", () => {
    expect(HISTORICAL_2013_2016_PERIODS.map((p) => p.id)).toEqual([
      "2013-pre-apr", "2013-apr-jun", "2013-h2",
      "2014-h1", "2014-h2", "2015-h1", "2015-h2", "2016-h1", "2016-h2",
    ]);
  });

  it("resolves every boundary without gaps", () => {
    expect(resolveHistorical2013_2016("2013-01-01").id).toBe("2013-pre-apr");
    expect(resolveHistorical2013_2016("2013-03-31").id).toBe("2013-pre-apr");
    expect(resolveHistorical2013_2016("2013-04-01").id).toBe("2013-apr-jun");
    expect(resolveHistorical2013_2016("2013-07-01").id).toBe("2013-h2");
    expect(resolveHistorical2013_2016("2014-07-01").id).toBe("2014-h2");
    expect(resolveHistorical2013_2016("2016-12-31").id).toBe("2016-h2");
  });

  it("fails closed outside the batch", () => {
    expect(() => resolveHistorical2013_2016("2012-12-31")).toThrow(/REVIEW_REQUIRED/);
    expect(() => resolveHistorical2013_2016("2017-01-01")).toThrow(/REVIEW_REQUIRED/);
  });

  it("keeps the 2013 transition explicit", () => {
    expect(resolveHistorical2013_2016("2013-03-31").transition).toBe("pre-2013-guidelines");
    expect(resolveHistorical2013_2016("2013-04-01").transition).toBe("2013-guidelines");
  });
});
