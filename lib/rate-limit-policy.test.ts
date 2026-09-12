import { describe, expect, it } from "vitest";
import { decideRateLimit, normalizeRateLimitPolicy, rateLimitHeaders } from "./rate-limit-policy";

describe("rate-limit policy", () => {
  it("normalizes unsafe policy values", () => {
    expect(normalizeRateLimitPolicy({ limit: -4, windowSeconds: 0 })).toEqual({
      limit: 1,
      windowSeconds: 1,
      retryAfterSeconds: 1,
    });
  });

  it("allows requests below the limit", () => {
    expect(decideRateLimit(4, { limit: 5 })).toEqual({ allowed: true, remaining: 1 });
  });

  it("rejects requests at the limit", () => {
    const decision = decideRateLimit(5, { limit: 5, retryAfterSeconds: 12 });
    expect(decision).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 12 });
    expect(rateLimitHeaders(decision, { limit: 5, windowSeconds: 60 })).toEqual(
      expect.objectContaining({})
    );
  });
});
