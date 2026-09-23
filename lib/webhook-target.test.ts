import { describe, expect, it, vi } from "vitest";

vi.mock("node:dns/promises", () => ({
  default: { lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]) },
}));

import { assertSafeWebhookUrl } from "./webhook-target";

describe("webhook target security", () => {
  it("accepts an HTTPS public target", async () => {
    await expect(assertSafeWebhookUrl("https://example.com/hooks")).resolves.toBeInstanceOf(URL);
  });

  it("rejects non-HTTPS targets", async () => {
    await expect(assertSafeWebhookUrl("http://example.com/hooks")).rejects.toThrow("HTTPS");
  });

  it("rejects loopback and private literal addresses", async () => {
    await expect(assertSafeWebhookUrl("https://127.0.0.1/hooks")).rejects.toThrow("private");
    await expect(assertSafeWebhookUrl("https://192.168.1.10/hooks")).rejects.toThrow("private");
  });

  it("rejects credentials embedded in the URL", async () => {
    await expect(assertSafeWebhookUrl("https://user:pass@example.com/hooks")).rejects.toThrow("credentials");
  });
});
