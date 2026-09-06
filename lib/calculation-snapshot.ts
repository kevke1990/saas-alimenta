import { createHash } from "node:crypto";

export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => [k, canonicalize(v)]));
  }
  return value;
}

export function calculationFingerprint(input: unknown, engineVersion: string, normVersion: string) {
  const payload = JSON.stringify(canonicalize({ engineVersion, normVersion, input }));
  return createHash("sha256").update(payload).digest("hex");
}
