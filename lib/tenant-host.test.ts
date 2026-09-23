import { describe, expect, it } from "vitest";
import { getConfiguredBaseDomain, isReservedTenantSlug, isValidTenantSlug, normalizeHostname, parseTenantHost, tenantHostname, TenantHostError } from "./tenant-host";

const env = (values: Record<string, string> = {}) =>
  ({ NODE_ENV: "test", ...values }) as Parameters<typeof getConfiguredBaseDomain>[0];

describe("tenant host routing", () => {
  it("normalizes a hostname and strips a port", () => expect(normalizeHostname("  ACME.Alimenta.nl:443. ")).toBe("acme.alimenta.nl"));
  it("parses the root domain", () => expect(parseTenantHost("alimenta.nl", "alimenta.nl")).toEqual({ kind: "ROOT", hostname: "alimenta.nl", tenantSlug: null }));
  it("parses exactly one tenant label", () => expect(parseTenantHost("acme.alimenta.nl:443", "alimenta.nl")).toEqual({ kind: "TENANT", hostname: "acme.alimenta.nl", tenantSlug: "acme" }));
  it("rejects nested and unrelated hosts", () => {
    expect(() => parseTenantHost("foo.acme.alimenta.nl", "alimenta.nl")).toThrow(TenantHostError);
    expect(() => parseTenantHost("acme.example.com", "alimenta.nl")).toThrow(TenantHostError);
  });
  it("rejects reserved and malformed slugs", () => {
    expect(isReservedTenantSlug("api")).toBe(true);
    expect(isValidTenantSlug("a")).toBe(true);
    expect(isValidTenantSlug("-bad")).toBe(false);
    expect(isValidTenantSlug("bad_underscore")).toBe(false);
    expect(() => tenantHostname("api", "alimenta.nl")).toThrow(TenantHostError);
  });
  it("rejects credentials and path injection", () => {
    expect(() => normalizeHostname("https://acme.alimenta.nl")).toThrow(TenantHostError);
    expect(() => normalizeHostname("user@acme.alimenta.nl")).toThrow(TenantHostError);
  });
  it("builds a canonical tenant hostname", () => expect(tenantHostname("Acme", "Alimenta.nl")).toBe("acme.alimenta.nl"));
  it("does not invent a base domain", () => expect(getConfiguredBaseDomain(env())).toBeNull());
  it("validates configured base domains", () => {
    expect(getConfiguredBaseDomain(env({ ALIMENTA_BASE_DOMAIN: "alimenta.nl" }))).toBe("alimenta.nl");
    expect(() => getConfiguredBaseDomain(env({ ALIMENTA_BASE_DOMAIN: "localhost" }))).toThrow(TenantHostError);
  });
});
