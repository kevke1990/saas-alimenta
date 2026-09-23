import { describe, expect, it, vi } from "vitest";

vi.mock("node:dns/promises", () => ({
  default: { lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]) },
}));

import { assertSafeWebhookUrl } from "./webhook-target";

describe("webhook target security", () => {
  it("accepts an HTTPS public target", async () => {
    await expect(assertSafeWebhookUrl("https://example.com/hooks")).resolves.toMatchObject({
      address: "93.184.216.34",
      family: 4,
      hostname: "example.com",
    });
  });

  it("rejects non-HTTPS targets", async () => {
    await expect(assertSafeWebhookUrl("http://example.com/hooks")).rejects.toThrow("HTTPS");
  });

  it("rejects loopback and private literal addresses", async () => {
    await expect(assertSafeWebhookUrl("https://127.0.0.1/hooks")).rejects.toThrow("private");
    await expect(assertSafeWebhookUrl("https://192.168.1.10/hooks")).rejects.toThrow("private");
  });

  it("rejects IPv4-mapped loopback addresses", async () => {
    await expect(assertSafeWebhookUrl("https://[::ffff:127.0.0.1]/hooks")).rejects.toThrow("private");
  });

  it("rejects the shared-address IPv4 range boundaries", async () => {
    await expect(assertSafeWebhookUrl("https://100.64.0.0/hooks")).rejects.toThrow("private");
    await expect(assertSafeWebhookUrl("https://100.127.255.255/hooks")).rejects.toThrow("private");
    await expect(assertSafeWebhookUrl("https://100.128.0.0/hooks")).resolves.toMatchObject({ address: "100.128.0.0" });
  });

  it("unwraps and rejects bracketed IPv6 literals", async () => {
    await expect(assertSafeWebhookUrl("https://[::1]/hooks")).rejects.toThrow("private");
    await expect(assertSafeWebhookUrl("https://[fc00::1]/hooks")).rejects.toThrow("private");
    await expect(assertSafeWebhookUrl("https://[2606:4700:4700::1111]/hooks")).resolves.toMatchObject({
      address: "2606:4700:4700::1111",
      family: 6,
    });
  });

  it("rejects credentials embedded in the URL", async () => {
    await expect(assertSafeWebhookUrl("https://user:pass@example.com/hooks")).rejects.toThrow("credentials");
  });
});
