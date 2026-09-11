import { createHash } from "node:crypto";

export const CALCULATION_ENGINE_V2 = "2.0.0";
export const CALCULATION_CONTRACT_VERSION = "2026.2";

/**
 * Canonical JSON is used for calculation fingerprints. Object key ordering must
 * not change the identity of a calculation snapshot.
 */
export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}

export function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value: unknown) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function roundMoney(value: number) {
  if (!Number.isFinite(value)) throw new Error("Geldbedrag is ongeldig.");
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type CalculationFingerprint = {
  engineVersion: string;
  contractVersion: string;
  normVersion: string;
  inputHash: string;
  resultHash: string;
};

export function fingerprintCalculation(input: unknown, result: unknown, normVersion: string): CalculationFingerprint {
  if (!normVersion?.trim()) throw new Error("Een normversie is verplicht voor een reproduceerbare berekening.");
  return {
    engineVersion: CALCULATION_ENGINE_V2,
    contractVersion: CALCULATION_CONTRACT_VERSION,
    normVersion,
    inputHash: sha256(input),
    resultHash: sha256(result),
  };
}
