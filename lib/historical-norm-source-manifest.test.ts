import { describe, expect, it } from "vitest";
import {
  HISTORICAL_NORM_SOURCE_MANIFEST,
  RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
} from "./historical-norm-source-manifest";

describe("historical norm source manifest", () => {
  it("uses the official Rechtspraak archive as provenance", () => {
    expect(HISTORICAL_NORM_SOURCE_MANIFEST.length).toBeGreaterThanOrEqual(23);
    for (const source of HISTORICAL_NORM_SOURCE_MANIFEST) {
      expect(source.sourcePage).toBe(RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE);
      expect(source.sourceTitle.length).toBeGreaterThan(0);
      expect(source.parameterDocuments.length).toBeGreaterThan(0);
      for (const url of source.sourceDocumentUrls ?? []) {
        expect(url).toMatch(/^https:\/\/www\.rechtspraak\.nl\//);
      }
    }
  });

  it("contains no duplicate period identifiers", () => {
    const ids = HISTORICAL_NORM_SOURCE_MANIFEST.map((source) => source.periodId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("records the 2006 and 2007 source limitations and verified 2007 transition sources", () => {
    const sources = new Map(HISTORICAL_NORM_SOURCE_MANIFEST.map((source) => [source.periodId, source]));
    expect(sources.get("2006")?.transitionNote).toMatch(/full Tremarapport/);
    expect(sources.get("2007-H1")?.effectiveFrom).toBe("2007-01-01");
    expect(sources.get("2007-H1")?.sourceDocumentUrls?.[0]).toContain("Bijlage-2007-eerste-helft.pdf");
    expect(sources.get("2007-H2")?.effectiveFrom).toBe("2007-07-01");
    expect(sources.get("2007-H2")?.sourceDocumentUrls?.[0]).toContain("Bijlage-2007-tweede-helft.pdf");
  });

  it("covers the documented transition points from 2006 through 2026", () =>
    const ids = new Set(HISTORICAL_NORM_SOURCE_MANIFEST.map((source) => source.periodId));
    expect(ids.has("2006")).toBe(true);
    expect(ids.has("2007-H1")).toBe(true);
    expect(ids.has("2007-H2")).toBe(true);
    expect(ids.has("2011-H2")).toBe(true);
    expect(ids.has("2013-H1")).toBe(true);
    expect(ids.has("2013-H2")).toBe(true);
    expect(ids.has("2020-H1")).toBe(true);
    expect(ids.has("2020-H2")).toBe(true);
    expect(ids.has("2026-H1")).toBe(true);
    expect(ids.has("2026-H2")).toBe(true);
  });
});
