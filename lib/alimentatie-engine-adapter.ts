/** Adapter boundary between Alimenta form payloads and the audited Trema 2026 core. */
import type { CapacityInput, ParentCalculationInput, Trema2026Input } from "@/lib/alimentatie-engine-trema-2026";

type NumericLike = number | string | null | undefined;
type RawParent = Record<string, unknown>;

export type AlimentaFormPayload = {
  referenceYear?: NumericLike;
  need?: { ownShareMonthly?: NumericLike; exceptionalCostsMonthly?: NumericLike; alreadyIncludedExceptionalCostsMonthly?: NumericLike };
  payer?: RawParent;
  recipient?: RawParent;
  parents?: RawParent[];
  children?: Array<{ specialCosts?: NumericLike; ownIncome?: NumericLike }>;
  care?: { carePercentage?: NumericLike; careDiscountBaseMonthly?: NumericLike; careDiscountOverrideMonthly?: NumericLike };
  nonVerzilverbareKgbCorrectionMonthly?: NumericLike;
};

function money(value: NumericLike, field: string, fallback?: number): number {
  if (value === null || value === undefined || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${field} ontbreekt.`);
  }
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(parsed)) throw new Error(`${field} moet een geldig bedrag zijn.`);
  if (parsed < 0) throw new Error(`${field} mag niet negatief zijn.`);
  return parsed;
}

function parent(id: "A" | "B", raw: RawParent | undefined): ParentCalculationInput {
  if (!raw) throw new Error(`Gegevens voor ouder ${id} ontbreken.`);
  const income = money(raw.monthlyNbi as NumericLike, `ouder ${id}: netto besteedbaar inkomen`);
  const kgb = money(raw.monthlyKgb as NumericLike, `ouder ${id}: KGB`, 0);
  const capacity: CapacityInput = {
    income: { monthlyNbi: income, monthlyKgb: kgb, kgbVerified: raw.kgbVerified !== false, referenceYear: 2026 },
    household: raw.household === "pension" ? "pension" : raw.household === "married" ? "married" : "single",
    aowEligible: raw.aowEligible === true,
    officialCapacityMonthly: raw.officialCapacityMonthly === undefined ? undefined : money(raw.officialCapacityMonthly as NumericLike, `ouder ${id}: officiële draagkracht`),
    capacityMethod: raw.capacityMethod === "official-table" ? "official-table" : "published-formula",
    correctedAssistanceNormMonthly: raw.correctedAssistanceNormMonthly === undefined ? undefined : money(raw.correctedAssistanceNormMonthly as NumericLike, `ouder ${id}: gecorrigeerde bijstandsnorm`),
    housingBudgetMonthly: raw.housingBudgetMonthly === undefined ? undefined : money(raw.housingBudgetMonthly as NumericLike, `ouder ${id}: woonbudget`),
    otherNecessaryCostsMonthly: money(raw.otherNecessaryCostsMonthly as NumericLike, `ouder ${id}: noodzakelijke lasten`, 0),
    existingChildSupportMonthly: money(raw.existingChildSupportMonthly as NumericLike, `ouder ${id}: bestaande kinderalimentatie`, 0),
    otherPriorityMaintenanceMonthly: money(raw.otherPriorityMaintenanceMonthly as NumericLike, `ouder ${id}: prioritaire verplichtingen`, 0),
    professionalCorrectionMonthly: money(raw.professionalCorrectionMonthly as NumericLike, `ouder ${id}: professionele correctie`, 0),
  };
  return { id, capacity };
}

function resolveParent(payload: AlimentaFormPayload, index: number): RawParent | undefined {
  return payload.parents?.[index] ?? (index === 0 ? payload.payer : payload.recipient);
}

export function adaptAlimentaForm(payload: AlimentaFormPayload): Trema2026Input {
  const referenceYear = money(payload.referenceYear, "peiljaar", 2026);
  if (referenceYear !== 2026) throw new Error("De huidige adapter ondersteunt uitsluitend peiljaar 2026.");

  const childrenNeed = (payload.children ?? []).reduce((sum, child) => sum + money(child.specialCosts, "bijzondere kindkosten", 0) - money(child.ownIncome, "eigen inkomen kind", 0), 0);
  const explicitNeed = payload.need?.ownShareMonthly;
  const ownShareMonthly = explicitNeed === undefined ? childrenNeed : money(explicitNeed, "eigen aandeel");
  if (ownShareMonthly <= 0) throw new Error("Het eigen aandeel/behoefte moet groter zijn dan nul.");

  const care = payload.care ? {
    carePercentage: money(payload.care.carePercentage, "zorgpercentage", 0),
    careDiscountBaseMonthly: payload.care.careDiscountBaseMonthly === undefined ? undefined : money(payload.care.careDiscountBaseMonthly, "zorgkortingsgrondslag"),
    careDiscountOverrideMonthly: payload.care.careDiscountOverrideMonthly === undefined ? undefined : money(payload.care.careDiscountOverrideMonthly, "zorgkorting"),
  } : undefined;

  return {
    referenceYear: 2026,
    need: {
      ownShareMonthly,
      exceptionalCostsMonthly: money(payload.need?.exceptionalCostsMonthly, "bijzondere kosten", 0),
      alreadyIncludedExceptionalCostsMonthly: money(payload.need?.alreadyIncludedExceptionalCostsMonthly, "reeds opgenomen bijzondere kosten", 0),
    },
    payer: parent("A", resolveParent(payload, 0)),
    recipient: parent("B", resolveParent(payload, 1)),
    care,
    nonVerzilverbareKgbCorrectionMonthly: money(payload.nonVerzilverbareKgbCorrectionMonthly, "niet-verzilverbare KGB-correctie", 0),
  };
}
