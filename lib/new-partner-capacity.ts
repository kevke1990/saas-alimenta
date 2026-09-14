export type NewPartnerChildObligation = {
  id?: string;
  label?: string;
  monthlyAmount: number;
  active?: boolean;
};

export type NewPartnerCapacityInput = {
  declaredZeroCapacity?: boolean;
  monthlyNbi?: number;
  monthlyNecessaryCosts?: number;
  childObligations?: NewPartnerChildObligation[];
};

export type NewPartnerCapacityResult = {
  partnerCapacity: number;
  obligationsTotal: number;
  amountAllocatedToNewPartner: number;
  amountAllocatedToOtherPerson: number;
  effectiveMaintenanceForOtherPerson: number;
  method: 'DECLARED_ZERO_CAPACITY' | 'REMAINING_CAPACITY' | 'NO_DATA';
  notes: string[];
};

const nonNegative = (value: unknown) => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);

/**
 * Models the new partner's contribution to obligations concerning their own
 * children. If the new partner has no draagkracht, the other person carries
 * the full verified obligation in the partner-support calculation.
 */
export function calculateNewPartnerCapacity(input: NewPartnerCapacityInput): NewPartnerCapacityResult {
  const obligationsTotal = (input.childObligations ?? [])
    .filter((item) => item.active !== false)
    .reduce((sum, item) => sum + nonNegative(item.monthlyAmount), 0);

  const hasExplicitZero = input.declaredZeroCapacity === true;
  const hasIncomeData = input.monthlyNbi !== undefined || input.monthlyNecessaryCosts !== undefined;
  const calculatedCapacity = hasIncomeData
    ? Math.max(0, nonNegative(input.monthlyNbi) - nonNegative(input.monthlyNecessaryCosts))
    : 0;
  const partnerCapacity = hasExplicitZero ? 0 : calculatedCapacity;
  const amountAllocatedToNewPartner = Math.min(partnerCapacity, obligationsTotal);
  const amountAllocatedToOtherPerson = Math.max(0, obligationsTotal - amountAllocatedToNewPartner);

  const notes: string[] = [];
  if (hasExplicitZero) {
    notes.push('Nieuwe partner is expliciet als draagkrachtloos aangemerkt.');
    notes.push('De volledige opgegeven zorg-/onderhoudsverplichting wordt bij de andere persoon gelegd.');
  } else if (!hasIncomeData) {
    notes.push('Geen inkomensgegevens van de nieuwe partner opgegeven; controleer of 0 draagkracht expliciet moet worden geselecteerd.');
  } else {
    notes.push('Bijdrage van de nieuwe partner is berekend op basis van NBI minus opgegeven noodzakelijke lasten.');
  }
  if (obligationsTotal === 0) notes.push('Geen actieve zorg-/onderhoudsverplichtingen voor kinderen van de nieuwe partner opgegeven.');

  return {
    partnerCapacity,
    obligationsTotal,
    amountAllocatedToNewPartner,
    amountAllocatedToOtherPerson,
    effectiveMaintenanceForOtherPerson: amountAllocatedToOtherPerson,
    method: hasExplicitZero ? 'DECLARED_ZERO_CAPACITY' : hasIncomeData ? 'REMAINING_CAPACITY' : 'NO_DATA',
    notes,
  };
}
