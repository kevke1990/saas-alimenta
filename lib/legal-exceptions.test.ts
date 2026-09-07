import { describe, expect, it } from "vitest";
import { detectLegalExceptions } from "./legal-exceptions";

describe("detectLegalExceptions", () => {
  it("signals partner duration exceptions and new-family circumstances", () => {
    const items = detectLegalExceptions({
      assetsA: 100000,
      partnerSupport: { enabled: true, payerIndex: 0, durationException: "AGREEMENT_OR_COURT", incomeComparisonEnabled: true },
      parents: [
        { aow: true, housing: { type: "OWNED" }, newPartner: { present: true, relationship: "COHABITING", children: [{ age: 8 }] } },
        { newPartner: { present: false, relationship: "NONE" } },
      ],
      children: [{ age: 19 }],
    });

    expect(items.map((x) => x.key)).toEqual(expect.arrayContaining([
      "partner.duration.exception",
      "partner.income.comparison",
      "parent.0.newpartner",
      "parent.0.newpartner.children",
      "parent.0.aow",
      "parent.0.owned.home",
      "children.adult",
      "assets.review",
    ]));
  });

  it("does not invent exceptions for a basic child-support case", () => {
    const items = detectLegalExceptions({
      parents: [{ newPartner: { present: false } }, { newPartner: { present: false } }],
      children: [{ age: 10 }],
      partnerSupport: { enabled: false, payerIndex: 0 },
    });
    expect(items).toEqual([]);
  });
});
