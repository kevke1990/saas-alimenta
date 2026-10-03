import type { Trema2027Input } from "./alimentatie-engine-trema-2027";
import { calculateTrema2027 } from "./alimentatie-engine-trema-2027";

type NumericLike = number | string | null | undefined;
type RawParent = Record<string, unknown>;

function money(value: NumericLike, field: string, fallback?: number): number {
  if (value === null || value === undefined || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} ontbreekt.`);
  }
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${field} moet een geldig niet-negatief bedrag zijn.`);
  return parsed;
}

function parent(id: "A" | "B", raw: RawParent | undefined) {
  if (!raw) throw new Error(`Gegevens voor ouder ${id} ontbreken.`);
  return {
    id,
    monthlyNbi: money(raw.monthlyNbi ?? raw.nbi, `ouder ${id}: netto besteedbaar inkomen`),
    monthlyKgb: money(raw.monthlyKgb ?? raw.kgb, `ouder ${id}: KGB`, 0),
    kgbVerified: raw.kgbVerified !== false,
    officialCapacityMonthly: money(raw.officialCapacityMonthly, `ouder ${id}: officiële 2027-draagkracht`),
  };
}

/**
 * Adapter for 2027 payloads. It deliberately requires explicit official
 * capacity values and never falls back to the 2026 engine.
 */
export function adaptAlimentaForm2027(payload: {
  referenceYear?: NumericLike;
  need?: { ownShareMonthly?: NumericLike; exceptionalCostsMonthly?: NumericLike; alreadyIncludedExceptionalCostsMonthly?: NumericLike };
  payer?: RawParent;
  recipient?: RawParent;
  parents?: RawParent[];
  care?: { carePercentage?: NumericLike; careDiscountBaseMonthly?: NumericLike; careDiscountOverrideMonthly?: NumericLike };
  nonVerzilverbareKgbCorrectionMonthly?: NumericLike;
}): Trema2027Input {
  if (Number(payload.referenceYear ?? 2027) !== 2027) {
    throw new Error("REVIEW_REQUIRED: de 2027-adapter accepteert uitsluitend peiljaar 2027.");
  }

  const ownShare = money(payload.need?.ownShareMonthly, "eigen aandeel");
  if (ownShare <= 0) throw new Error("Het eigen aandeel/behoefte moet groter zijn dan nul.");

  const parents = payload.parents ?? [payload.payer, payload.recipient];
  const carePercentage = payload.care?.carePercentage === undefined ? undefined : money(payload.care.carePercentage, "zorgpercentage");

  return {
    referenceYear: 2027,
    ownShareMonthly: ownShare,
    exceptionalCostsMonthly: money(payload.need?.exceptionalCostsMonthly, "bijzondere kosten", 0),
    alreadyIncludedExceptionalCostsMonthly: money(payload.need?.alreadyIncludedExceptionalCostsMonthly, "reeds opgenomen bijzondere kosten", 0),
    payer: parent("A", parents[0]),
    recipient: parent("B", parents[1]),
    carePercentage,
    careDiscountBaseMonthly: payload.care?.careDiscountBaseMonthly === undefined ? undefined : money(payload.care.careDiscountBaseMonthly, "zorgkortingsgrondslag"),
    careDiscountOverrideMonthly: payload.care?.careDiscountOverrideMonthly === undefined ? undefined : money(payload.care.careDiscountOverrideMonthly, "zorgkorting"),
    nonVerzilverbareKgbCorrectionMonthly: money(payload.nonVerzilverbareKgbCorrectionMonthly, "niet-verzilverbare KGB-correctie", 0),
  };
}

export function calculateAlimenta2027(payload: Parameters<typeof adaptAlimentaForm2027>[0]) {
  return calculateTrema2027(adaptAlimentaForm2027(payload));
}
