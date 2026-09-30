import { describe, expect, it } from "vitest";
import { historicalRulesFor2013_2016 } from "./historical-2013-2016-rules";

describe("2013-2016 historical rules", () => {
  it("keeps the 2013 transition explicit", () => {
    expect(historicalRulesFor2013_2016("2013-03-31").regime).toBe("pre-2013-guidelines");
    expect(historicalRulesFor2013_2016("2013-04-01").regime).toBe("2013-guidelines");
  });
  it("applies KGB to child need from 2013", () => {
    expect(historicalRulesFor2013_2016("2014-12-31").kgbTreatment).toBe("child-need");
  });
  it("applies WHK treatment from 2015", () => {
    expect(historicalRulesFor2013_2016("2015-01-01").kgbTreatment).toBe("child-need-including-single-parent-head");
  });
});
