import { describe, expect, it } from "vitest";
import {
  HISTORICAL_NORM_SOURCE_MANIFEST,
  RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
} from "./historical-norm-source-manifest";

describe("historical norm source manifest", () => {
  it("uses the official Rechtspraak archive as provenance", () => {
    expect(HISTORICAL_NORM_SOURCE_MANIFEST.length).toBeGreaterThanOrEqual(20);
    for (const source of HISTORICAL_NORM_SOURCE_MANIFEST) {
      expect(source.sourcePage).toBe(RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE);
      expect(source.sourceTitle.length).toBeGreaterThan(0);
      expect(source.parameterDocuments.length).toBeGreaterThan(0);
    }
  });

  it("contains no duplicate period identifiers", () => {
    const ids = HISTORICAL_NORM_SOURCE_MANIFEST.map((source) => source.periodId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers the documented transition points from 2011 through 2026", () => {
    const ids = new Set(HISTORICAL_NORM_SOURCE_MANIFEST.map((source) => source.periodId));
    expect(ids.has("2011-H2")).toBe(true);
    expect(ids.has("2013-H1")).toBe(true);
    expect(ids.has("2013-H2")).toBe(true);
    expect(ids.has("2020-H1")).toBe(true);
    expect(ids.has("2020-H2")).toBe(true);
    expect(ids.has("2026-H1")).toBe(true);
    expect(ids.has("2026-H2")).toBe(true);
  });
});
