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

  it("records official first- and second-half 2006 sources and the 2007 transition sources", () => {
    const sources = new Map(HISTORICAL_NORM_SOURCE_MANIFEST.map((source) => [source.periodId, source]));
    expect(sources.get("2006-H1")?.effectiveTo).toBe("2006-06-30");
    expect(sources.get("2006-H1")?.sourceDocumentUrls?.[0]).toContain("Bijlage-2006-eerste-helft.pdf");
    expect(sources.get("2006-H2")?.effectiveFrom).toBe("2006-07-01");
    expect(sources.get("2006-H2")?.sourceDocumentUrls?.[0]).toContain("Bijlage-2006-tweede-helft.pdf");
    expect(sources.get("2006-H1")?.transitionNote).toMatch(/still require extraction/);
    expect(sources.get("2007-H1")?.effectiveFrom).toBe("2007-01-01");
    expect(sources.get("2007-H1")?.sourceDocumentUrls?.[0]).toContain("Bijlage-2007-eerste-helft.pdf");
    expect(sources.get("2007-H2")?.effectiveFrom).toBe("2007-07-01");
    expect(sources.get("2007-H2")?.sourceDocumentUrls?.[0]).toContain("Bijlage-2007-tweede-helft.pdf");
  });

  it("records the 1 April 2013 rules transition from the official report", () => {
    const sources = new Map(HISTORICAL_NORM_SOURCE_MANIFEST.map((source) => [source.periodId, source]));
    expect(sources.get("2013-H1")?.effectiveTo).toBe("2013-03-31");
    expect(sources.get("2013-APR")?.effectiveFrom).toBe("2013-04-01");
    expect(sources.get("2013-APR")?.sourceDocumentUrls?.[0]).toContain("rapport-alimentatienormen-2013.pdf");
  });

  it("keeps the unresolved 2011 first-half source gap explicit", () => {
    const source = HISTORICAL_NORM_SOURCE_MANIFEST.find((record) => record.periodId === "2011-H1");
    expect(source?.sourceDocumentUrls).toBeUndefined();
    expect(source?.transitionNote).toMatch(/remains non-executable/);
    const secondHalf = HISTORICAL_NORM_SOURCE_MANIFEST.find((record) => record.periodId === "2011-H2");
    expect(secondHalf?.sourceDocumentUrls?.[0]).toContain("lbvr-an-bijlage-2011-tweede-helft.pdf");
    expect(secondHalf?.transitionNote).toMatch(/reference calculations remain pending/);
  });

  it("records every discovered 2008-2010 half-year source and transition", () => {
    const sources = new Map(HISTORICAL_NORM_SOURCE_MANIFEST.map((source) => [source.periodId, source]));
    for (const year of [2008, 2009, 2010]) {
      for (const half of ["H1", "H2"]) {
        const source = sources.get(`${year}-${half}`);
        expect(source).toBeDefined();
        expect(source?.sourceDocumentUrls?.[0]).toMatch(/^https:\/\/www\.rechtspraak\.nl\/SiteCollectionDocuments\//);
      }
    }
    expect(sources.get("2008-H1")?.effectiveTo).toBe("2008-06-30");
    expect(sources.get("2008-H2")?.effectiveFrom).toBe("2008-07-01");
    expect(sources.get("2009-H1")?.effectiveTo).toBe("2009-06-30");
    expect(sources.get("2009-H2")?.effectiveFrom).toBe("2009-07-01");
    expect(sources.get("2010-H1")?.effectiveTo).toBe("2010-06-30");
    expect(sources.get("2010-H2")?.effectiveFrom).toBe("2010-07-01");
  });

  it("records separate official first- and second-half sources for 2018-2025", () => {
    const sources = new Map(HISTORICAL_NORM_SOURCE_MANIFEST.map((source) => [source.periodId, source]));
    for (const year of [2018, 2019, 2021, 2022, 2023, 2024, 2025]) {
      for (const half of ["H1", "H2"]) {
        const source = sources.get(`${year}-${half}`);
        expect(source).toBeDefined();
        expect(source?.sourceDocumentUrls?.[0]).toMatch(/^https:\/\/www\.rechtspraak\.nl\/binaries\//);
        expect(source?.effectiveFrom).toBe(half === "H1" ? `${year}-01-01` : `${year}-07-01`);
      }
    }
  });

  it("covers the documented transition points from 2006 through 2026", () => {
    const ids = new Set(HISTORICAL_NORM_SOURCE_MANIFEST.map((source) => source.periodId));
    expect(ids.has("2006-H1")).toBe(true);
    expect(ids.has("2006-H2")).toBe(true);
    expect(ids.has("2007-H1")).toBe(true);
    expect(ids.has("2007-H2")).toBe(true);
    for (const year of [2008, 2009, 2010]) {
      expect(ids.has(`${year}-H1`)).toBe(true);
      expect(ids.has(`${year}-H2`)).toBe(true);
    }
    expect(ids.has("2011-H1")).toBe(true);
    expect(ids.has("2011-H2")).toBe(true);
    expect(ids.has("2013-H1")).toBe(true);
    expect(ids.has("2013-APR")).toBe(true);
    expect(ids.has("2013-H2")).toBe(true);
    expect(ids.has("2020-H1")).toBe(true);
    expect(ids.has("2020-H2")).toBe(true);
    for (const year of [2018, 2019, 2021, 2022, 2023, 2024, 2025]) {
      expect(ids.has(`${year}-H1`)).toBe(true);
      expect(ids.has(`${year}-H2`)).toBe(true);
    }
    expect(ids.has("2026-H1")).toBe(true);
    expect(ids.has("2026-H2")).toBe(true);
  });
});
