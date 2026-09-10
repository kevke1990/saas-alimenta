import { describe, expect, it } from "vitest";
import { calculatePartnerSupport } from "./partner-calculator";

describe("2026 partner-support engine", () => {
  it("applies the 60% Hofnorm after the child-cost share", () => {
    const r = calculatePartnerSupport({
      marriageNBGI: 5548,
      childShareDuringMarriage: 808,
      payer: { nbi: 4156 },
      recipientCurrentNBI: 1763,
    });
    expect(r.hofNormBase).toBe(4740);
    expect(r.grossNeedBeforeOwnIncome).toBe(2844);
    expect(r.additionalNeed).toBe(1081);
    expect(r.netPartnerSupport).toBe(927);
  });

  it("gives child support priority before partner support", () => {
    const r = calculatePartnerSupport({
      marriageNBGI: 6000,
      childShareDuringMarriage: 1000,
      payer: { nbi: 4000 },
      recipientCurrentNBI: 1000,
      payerChildSupportShare: 700,
    });
    expect(r.payerRemainingCapacity).toBeLessThan(r.payerCapacityBeforeChildren);
    expect(r.netPartnerSupport).toBe(r.payerRemainingCapacity);
  });

  it("supports the optional 45% family route explicitly", () => {
    const r = calculatePartnerSupport({
      marriageNBGI: 5000,
      payer: { nbi: 4000, childCount: 1, isCareParent: true },
      recipientCurrentNBI: 0,
      payerCapacityPercentage: 0.45,
    });
    expect(r.capacityMethod).toBe("FORMULA_45");
    expect(r.warnings.some(w => w.includes("45%-gezinsroute"))).toBe(true);
  });

  it("does not count KGB as partner-support income", () => {
    const withKgb = calculatePartnerSupport({
      marriageNBGI: 5000,
      payer: { nbi: 4000, kgb: 500 },
      recipientCurrentNBI: 1000,
    });
    const withoutKgb = calculatePartnerSupport({
      marriageNBGI: 5000,
      payer: { nbi: 4000 },
      recipientCurrentNBI: 1000,
    });
    expect(withKgb.payerCapacityBeforeChildren).toBe(withoutKgb.payerCapacityBeforeChildren);
  });
});
