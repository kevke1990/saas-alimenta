export type RoundingMode = "HALF_UP";

export const CURRENCY_PRECISION = 2;
export const FINAL_CURRENCY_PRECISION = 0;

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Geldbedrag is ongeldig.");
  return Math.round((value + 1e-9) * 100) / 100;
}

export function roundWholeEuro(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Geldbedrag is ongeldig.");
  return Math.round(value + 1e-9);
}

export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) throw new Error("Geldbedrag is ongeldig.");
  const factor = 10 ** decimals;
  return Math.round((value + 1e-9) * factor) / factor;
}

export const ROUNDING_POLICY = {
  mode: "HALF_UP" as RoundingMode,
  intermediatePrecision: CURRENCY_PRECISION,
  currencyPrecision: CURRENCY_PRECISION,
  perChildRounding: FINAL_CURRENCY_PRECISION,
  finalRounding: FINAL_CURRENCY_PRECISION,
};
