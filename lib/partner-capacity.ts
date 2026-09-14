/**
 * Deterministic support model for a new partner.
 *
 * This module deliberately does not make the partner's income part of the
 * parent's income. It calculates the partner's own available capacity and
 * exposes the result so the main calculation can explain its treatment.
 *
 * ZERO_CAPACITY is an explicit, user-selected scenario. It must never be
 * inferred merely because income is missing.
 */

export type PartnerCapacityMode = "CALCULATE" | "ZERO_CAPACITY";

export type PartnerCareObligation = {
  id: string;
  description?: string;
  monthlyAmount: number;
  included: boolean;
};

export type PartnerCapacityInput = {
  mode?: PartnerCapacityMode;
  netMonthlyIncome: number;
  basicNeedMonthly: number;
  otherObligationsMonthly?: number;
  careObligations?: PartnerCareObligation[];
  allocationPercentage?: number;
};

export type PartnerCapacityResult = {
  mode: PartnerCapacityMode;
  netMonthlyIncome: number;
  basicNeedMonthly: number;
  otherObligationsMonthly: number;
  careObligationsMonthly: number;
  availableCapacityMonthly: number;
  allocatedCapacityMonthly: number;
  explanation: string[];
};

function nonNegative(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, value as number) : 0;
}

function percentage(value: number | undefined): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(100, Math.max(0, value as number));
}

export function calculatePartnerCapacity(input: PartnerCapacityInput): PartnerCapacityResult {
  const mode = input.mode ?? "CALCULATE";
  const netMonthlyIncome = nonNegative(input.netMonthlyIncome);
  const basicNeedMonthly = nonNegative(input.basicNeedMonthly);
  const otherObligationsMonthly = nonNegative(input.otherObligationsMonthly);
  const careObligationsMonthly = (input.careObligations ?? [])
    .filter((obligation) => obligation.included)
    .reduce((sum, obligation) => sum + nonNegative(obligation.monthlyAmount), 0);

  if (mode === "ZERO_CAPACITY") {
    return {
      mode,
      netMonthlyIncome,
      basicNeedMonthly,
      otherObligationsMonthly,
      careObligationsMonthly,
      availableCapacityMonthly: 0,
      allocatedCapacityMonthly: 0,
      explanation: [
        "De nieuwe partner is expliciet ingesteld op 0 draagkracht.",
        "De partner draagt in dit scenario niet bij aan de beschikbare draagkracht.",
        "De zorgverplichtingen van de partner worden wel geregistreerd en zichtbaar toegelicht, maar leiden niet tot een negatieve draagkracht.",
      ],
    };
  }

  const availableCapacityMonthly = Math.max(
    0,
    netMonthlyIncome - basicNeedMonthly - otherObligationsMonthly - careObligationsMonthly,
  );
  const allocatedCapacityMonthly = Math.round(
    (availableCapacityMonthly * percentage(input.allocationPercentage)) / 100 * 100,
  ) / 100;

  return {
    mode,
    netMonthlyIncome,
    basicNeedMonthly,
    otherObligationsMonthly,
    careObligationsMonthly,
    availableCapacityMonthly,
    allocatedCapacityMonthly,
    explanation: [
      "De draagkracht van de nieuwe partner wordt afzonderlijk berekend.",
      "De basisbehoefte, overige verplichtingen en geregistreerde zorgverplichtingen worden van het netto maandinkomen afgetrokken.",
      "De uitkomst wordt begrensd op minimaal € 0 en wordt alleen voor het opgegeven percentage aan de analyse toegerekend.",
    ],
  };
}

export function explainPartnerCareObligations(
  obligations: PartnerCareObligation[] = [],
): string[] {
  const included = obligations.filter((obligation) => obligation.included);
  if (included.length === 0) {
    return ["Er zijn geen actieve zorgverplichtingen voor kinderen van de nieuwe partner opgegeven."];
  }

  return [
    `Er zijn ${included.length} actieve zorgverplichting(en) voor kinderen van de nieuwe partner geregistreerd.`,
    "Deze verplichtingen worden als afzonderlijke last in de partneranalyse getoond.",
    "De bedragen moeten met bron, periode en toelichting worden onderbouwd voordat de uitkomst definitief kan worden gebruikt.",
  ];
}
