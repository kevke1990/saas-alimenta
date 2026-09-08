import { describe, expect, it } from "vitest";
import { requireSameOrigin } from "../lib/request-security";
import { rateLimit } from "../lib/rate-limit";
import { retentionCutoff, validateRetentionPolicy } from "../lib/retention";

describe("request security", () => {
  it("rejects cross-site fetch metadata", () => {
    const req = new Request("https://app.example.test/api/admin", { headers: { "sec-fetch-site": "cross-site" } });
    expect(() => requireSameOrigin(req)).toThrow("CROSS_ORIGIN_REQUEST");
  });

  it("accepts same-origin requests", () => {
    const previous = process.env.APP_URL;
    process.env.APP_URL = "https://app.example.test";
    try {
      const req = new Request("https://app.example.test/api/admin", { headers: { origin: "https://app.example.test", "sec-fetch-site": "same-origin" } });
      expect(() => requireSameOrigin(req)).not.toThrow();
    } finally {
      if (previous === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = previous;
    }
  });
});

describe("rate limit", () => {
  it("blocks the request after the configured limit", () => {
    const key = `test:${Date.now()}:${Math.random()}`;
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 2, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});

describe("retention policy", () => {
  it("rejects unsafe retention windows", () => {
    expect(() => validateRetentionPolicy({ documentsDays: 1 })).toThrow();
    expect(() => validateRetentionPolicy({ auditDays: 4000 })).toThrow();
  });

  it("calculates a deterministic UTC cutoff", () => {
    const now = new Date("2026-09-08T00:00:00.000Z");
    expect(retentionCutoff(now, 30).toISOString()).toBe("2026-08-09T00:00:00.000Z");
  });
});
