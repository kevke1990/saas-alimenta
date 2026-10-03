/**
 * Publicly announced 2027 policy inputs that are safe to record before the
 * 2027 Trema report is published. These are not a substitute for the official
 * 2027 Alimentatienormen tables.
 */

export const TREMA_2027_POLICY_INPUTS = {
  referenceYear: 2027,
  kindgebondenBudget: {
    announcedMaximumIncreasePerChild: 64,
    announcedIncomeTaperPercentage: 8.05,
    status: "announced-policy-input",
    source: "https://www.rijksoverheid.nl/binaries/rijksoverheid/documenten/kamerstukken/2024/09/17/wetsvoorstel-wijziging-wet-op-het-kindgebonden-budget/wetsvoorstel-wijziging-kindgebonden-budget.pdf",
  },
  officialTremaNorms: {
    status: "awaiting-publication",
    source: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen",
  },
} as const;

export type Trema2027PolicyStatus = typeof TREMA_2027_POLICY_INPUTS;
