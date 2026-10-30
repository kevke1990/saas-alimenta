import { describe, expect, it } from "vitest";
import { getHistorical2006_2012Period, HISTORICAL_2006_2012_PERIODS } from "./historical-2006-2012-regime";

describe("historical 2006-2012 regime", () => {
  it("covers every year without gaps", () => {
    expect(HISTORICAL_2006_2012_PERIODS.map((p) => p.id)).toEqual([
      "2006-historical", "2007-historical", "2008-historical", "2009-historical",
      "2010-historical", "2011-historical", "2012-historical",
    ]);
  });

  it("selects the correct historical year", () => {
    expect(getHistorical2006_2012Period("2006-01-01")?.id).toBe("2006-historical");
    expect(getHistorical2006_2012Period("2009-12-31")?.id).toBe("2009-historical");
    expect(getHistorical2006_2012Period("2012-12-31")?.id).toBe("2012-historical");
  });

  it("keeps the pre-2013 child-support percentage explicit", () => {
    expect(new Set(HISTORICAL_2006_2012_PERIODS.map((p) => p.childSupportPercentage))).toEqual(new Set([70]));
  });

  it("does not extend the pre-2013 regime into 2013", () => {
    expect(getHistorical2006_2012Period("2013-01-01")).toBeNull();
  });
});
