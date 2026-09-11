import { describe, expect, it } from "vitest";
import { WSF_2026, WSF_2026_H1 } from "./norms";

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
