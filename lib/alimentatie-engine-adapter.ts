/** Adapter boundary between Alimenta form payloads and the audited Trema 2026 core. */
import type {
  CapacityInput,
  ParentCalculationInput,
  Trema2026Input,
} from "@/lib/alimentatie-engine-trema-2026";

type NumericLike = number | string | null | undefined;

export type AlimentaFormPayload = {
  referenceYear?: NumericLike;
  need?: { ownShareMonthly?: NumericLike; exceptionalCostsMonthly?: NumericLike; alreadyIncludedExceptionalCostsMonthly?: NumericLike };
  payer?: Record<string, unknown>;
  recipient?: Record<string, unknown>;
  care?: { carePercentage?: NumericLike; careDiscountBaseMonthly?: NumericLike; careDiscountOverrideMonthly?: NumericLike };
  nonVerzilverbareKgbCorrectionMonthly?: NumericLike;
};

function money(value: NumericLike, field: string, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed)) throw new Error(`${field} moet een geldig bedrag zijn.`);
  return parsed;
}

function parent(id: "A" | "B", raw: Record<string, unknown> | undefined): ParentCalculationInput {
  const value = raw ?? {};
  const income = money(value.monthlyNbi as NumericLike, `ouder ${id}: netto besteedbaar inkomen`);
  const kgb = money(value.monthlyKgb as NumericLike, `ouder ${id}: KGB`);
  const capacity: CapacityInput = {
    income: { monthlyNbi: income, monthlyKgb: kgb, kgbVerified: value.kgbVerified !== false, referenceYear: 2026 },
    household: value.household === "pension" ? "pension" : value.household === "married" ? "married" : "single",
    aowEligible: value.aowEligible === true,
    officialCapacityMonthly: value.officialCapacityMonthly === undefined ? undefined : money(value.officialCapacityMonthly as NumericLike, `ouder ${id}: officiële draagkracht`),
    capacityMethod: value.capacityMethod === "official-table" ? "official-table" : "published-formula",
    correctedAssistanceNormMonthly: value.correctedAssistanceNormMonthly === undefined ? undefined : money(value.correctedAssistanceNormMonthly as NumericLike, `ouder ${id}: gecorrigeerde bijstandsnorm`),
    housingBudgetMonthly: value.housingBudgetMonthly === undefined ? undefined : money(value.housingBudgetMonthly as NumericLike, `ouder ${id}: woonbudget`),
    otherNecessaryCostsMonthly: money(value.otherNecessaryCostsMonthly as NumericLike, `ouder ${id}: noodzakelijke lasten`),
    existingChildSupportMonthly: money(value.existingChildSupportMonthly as NumericLike, `ouder ${id}: bestaande kinderalimentatie`),
    otherPriorityMaintenanceMonthly: money(value.otherPriorityMaintenanceMonthly as NumericLike, `ouder ${id}: prioritaire verplichtingen`),
    professionalCorrectionMonthly: money(value.professionalCorrectionMonthly as NumericLike, `ouder ${id}: professionele correctie`),
  };
  return { id, capacity };
}

export function adaptAlimentaForm(payload: AlimentaFormPayload): Trema2026Input {
  const referenceYear = money(payload.referenceYear, "peiljaar", 2026);
  if (referenceYear !== 2026) throw new Error("De huidige adapter ondersteunt uitsluitend peiljaar 2026.");
  return {
    referenceYear: 2026,
    need: {
      ownShareMonthly: money(payload.need?.ownShareMonthly, "eigen aandeel"),
      exceptionalCostsMonthly: money(payload.need?.exceptionalCostsMonthly, "bijzondere kosten"),
      alreadyIncludedExceptionalCostsMonthly: money(payload.need?.alreadyIncludedExceptionalCostsMonthly, "reeds opgenomen bijzondere kosten"),
    },
    payer: parent("A", payload.payer),
    recipient: parent("B", payload.recipient),
    care: payload.care ? {
      carePercentage: money(payload.care.carePercentage, "zorgpercentage"),
      careDiscountBaseMonthly: payload.care.careDiscountBaseMonthly === undefined ? undefined : money(payload.care.careDiscountBaseMonthly, "zorgkortingsgrondslag"),
      careDiscountOverrideMonthly: payload.care.careDiscountOverrideMonthly === undefined ? undefined : money(payload.care.careDiscountOverrideMonthly, "zorgkorting"),
    } : undefined,
    nonVerzilverbareKgbCorrectionMonthly: money(payload.nonVerzilverbareKgbCorrectionMonthly, "niet-verzilverbare KGB-correctie"),
  };
}
