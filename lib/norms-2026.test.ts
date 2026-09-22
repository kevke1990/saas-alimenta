import { describe, expect, it } from "vitest";
import { NORM_SETS, WSF_2026, WSF_2026_H1 } from "./norms";

describe("2026 July tariff refresh", () => {
  it("keeps the January-July MBO and HBO tuition values available for audit", () => {
    expect(WSF_2026_H1.mbo.tuition).toBe(121.5);
    expect(WSF_2026_H1.hbo.tuition).toBe(216.75);
  });

  it("uses the August-December 2026 tuition values as the effective current set", () => {
    expect(WSF_2026.mbo.tuition).toBe(125.92);
    expect(WSF_2026.hbo.tuition).toBe(224.5);
  });
});


describe("Historical NormSet regression anchors", () => {
  it("keeps the published need-table anchors for 2024, 2025 and 2026", () => {
    expect(NORM_SETS[2024].needTable[1][8]).toBe(720);
    expect(NORM_SETS[2025].needTable[1][6]).toBe(680);
    expect(NORM_SETS[2026].needTable[1][6]).toBe(680);
    expect(NORM_SETS[2026].needTable[4][6]).toBe(1460);
  });

  it("keeps the published capacity formula anchors", () => {
    expect(NORM_SETS[2024].capacity.underAow.necessary).toBe(1270);
    expect(NORM_SETS[2025].capacity.underAow.necessary).toBe(1310);
    expect(NORM_SETS[2026].capacity.underAow.necessary).toBe(1365);
    expect(NORM_SETS[2026].capacity.underAow.formulaThreshold).toBe(2200);
  });
});
