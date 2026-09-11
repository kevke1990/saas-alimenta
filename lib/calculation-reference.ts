export const CALCULATION_REFERENCE_VERSION = "2026.1";

export const CALCULATION_REFERENCE_SOURCES = {
  expertGroup: "Rechtspraak — Expertgroep Alimentatienormen",
  report: "Rapport Alimentatienormen, versie januari 2026",
  childTable: "Draagkrachttabel kinderalimentatie 2026",
} as const;

export type CalculationWarningCode =
  | "HISTORICAL_NBGI_REQUIRED"
  | "CAPACITY_INSUFFICIENT"
  | "YOUNG_ADULT"
  | "PROFESSIONAL_REVIEW_REQUIRED";

export type CalculationWarning = {
  code: CalculationWarningCode;
  severity: "INFO" | "WARNING" | "BLOCKING";
  message: string;
};

export function roundEuro(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

export function buildReferenceWarnings(input: {
  historicalNbgiSupplied: boolean;
  capacitySufficient: boolean;
  youngAdultPresent: boolean;
  professionalOverridePresent: boolean;
}): CalculationWarning[] {
  const warnings: CalculationWarning[] = [];
  if (!input.historicalNbgiSupplied) warnings.push({ code: "HISTORICAL_NBGI_REQUIRED", severity: "WARNING", message: "Controleer het historische NBGI wanneer de berekening niet op de actuele uitgangssituatie ziet." });
  if (!input.capacitySufficient) warnings.push({ code: "CAPACITY_INSUFFICIENT", severity: "WARNING", message: "De gezamenlijke draagkracht is onvoldoende voor de berekende behoefte." });
  if (input.youngAdultPresent) warnings.push({ code: "YOUNG_ADULT", severity: "INFO", message: "Voor een jongmeerderjarige moeten de WSF-uitgangspunten professioneel worden gecontroleerd." });
  if (input.professionalOverridePresent) warnings.push({ code: "PROFESSIONAL_REVIEW_REQUIRED", severity: "BLOCKING", message: "Er is een professionele afwijking vastgelegd; controleer deze voordat het dossier definitief wordt." });
  return warnings;
}
