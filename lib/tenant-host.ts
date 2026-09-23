const DEFAULT_RESERVED_SUBDOMAINS = new Set(["www","app","api","admin","beheer","mail","smtp","status","docs","support","help","cdn","assets","static","dev","staging"]);
const TENANT_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;
export type TenantHost = { kind: "ROOT" | "TENANT"; hostname: string; tenantSlug: string | null };
export class TenantHostError extends Error { readonly code = "INVALID_TENANT_HOST"; constructor(message: string) { super(message); this.name = "TenantHostError"; } }
export function normalizeHostname(raw: string): string {
  const value = String(raw ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (!value || value.includes("/") || value.includes("@")) throw new TenantHostError("Ongeldige hostname.");
  const withoutPort = value.replace(/^\[(.*)\]:(?:\d{1,5})$/, "$1").replace(/:\d{1,5}$/, "");
  if (!withoutPort || withoutPort.includes(":")) throw new TenantHostError("Ongeldige hostname.");
  if (withoutPort.length > 253) throw new TenantHostError("Hostname is te lang.");
  return withoutPort;
}
export function normalizeBaseDomain(raw: string): string {
  const domain = normalizeHostname(raw);
  if (domain === "localhost" || domain.endsWith(".localhost")) throw new TenantHostError("Een localhost-basisdomain is niet toegestaan.");
  if (domain.split(".").length < 2) throw new TenantHostError("Basisdomain moet een domeinnaam bevatten.");
  return domain;
}
export function isValidTenantSlug(slug: string): boolean { return TENANT_SLUG_RE.test(slug) && slug.length <= 48; }
export function isReservedTenantSlug(slug: string, reserved = DEFAULT_RESERVED_SUBDOMAINS): boolean { return reserved.has(slug.toLowerCase()); }
export function parseTenantHost(rawHost: string, rawBaseDomain: string, reserved = DEFAULT_RESERVED_SUBDOMAINS): TenantHost {
  const hostname = normalizeHostname(rawHost);
  const baseDomain = normalizeBaseDomain(rawBaseDomain);
  if (hostname === baseDomain) return { kind: "ROOT", hostname, tenantSlug: null };
  const suffix = "." + baseDomain;
  if (!hostname.endsWith(suffix)) throw new TenantHostError("Host behoort niet tot het Alimenta-basisdomain.");
  const prefix = hostname.slice(0, -suffix.length);
  if (!prefix || prefix.includes(".") || !isValidTenantSlug(prefix) || isReservedTenantSlug(prefix, reserved)) throw new TenantHostError("Ongeldig of gereserveerd tenant-subdomein.");
  return { kind: "TENANT", hostname, tenantSlug: prefix };
}
export function tenantHostname(slug: string, rawBaseDomain: string): string {
  const normalizedSlug = String(slug ?? "").trim().toLowerCase();
  if (!isValidTenantSlug(normalizedSlug) || isReservedTenantSlug(normalizedSlug)) throw new TenantHostError("Ongeldige of gereserveerde tenant-slug.");
  return normalizedSlug + "." + normalizeBaseDomain(rawBaseDomain);
}
export function getConfiguredBaseDomain(env: NodeJS.ProcessEnv = process.env): string | null { const raw = env.ALIMENTA_BASE_DOMAIN?.trim(); return raw ? normalizeBaseDomain(raw) : null; }
