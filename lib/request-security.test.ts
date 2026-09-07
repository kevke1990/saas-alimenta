import { describe, expect, it, beforeEach } from "vitest";
import { requireSameOrigin } from "./request-security";

describe("requireSameOrigin", () => {
  beforeEach(() => {
    process.env.APP_URL = "https://alimenta.example";
  });

  it("accepts a matching origin", () => {
    expect(() => requireSameOrigin(new Request("https://alimenta.example/api/test", { headers: { origin: "https://alimenta.example" } }))).not.toThrow();
  });

  it("rejects a cross-site fetch", () => {
    expect(() => requireSameOrigin(new Request("https://alimenta.example/api/test", { headers: { "sec-fetch-site": "cross-site" } }))).toThrow("CROSS_ORIGIN_REQUEST");
  });

  it("rejects a mismatching origin", () => {
    expect(() => requireSameOrigin(new Request("https://alimenta.example/api/test", { headers: { origin: "https://evil.example" } }))).toThrow("CROSS_ORIGIN_REQUEST");
  });
});
