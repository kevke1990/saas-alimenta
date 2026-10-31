/**
 * 2023 historical verification plan.
 *
 * This is deliberately a verification manifest, not a claim that values are
 * executable. A category becomes verified only after its official source,
 * locator, effective period and implementation test have all been checked.
 */
export const HISTORICAL_NORM_2023_VERIFICATION_PLAN = {
  version: "2023.2-verification",
  periods: [
    { from: "2023-01-01", to: "2023-06-30", source: "Rechtspraak Bijlage januari 2023" },
    { from: "2023-07-01", to: "2023-12-31", source: "Rechtspraak Bijlage juli 2023" },
  ],
  requiredCategories: [
    "needTable",
    "capacity",
    "careDiscount",
    "wsf",
    "fiscalParameters",
    "socialPremiumParameters",
    "minimumIncome",
    "otherRequiredNormInputs",
  ] as const,
  verificationRules: [
    "Every value must have an official Rechtspraak source and locator.",
    "No parameter may silently cross a January/July boundary.",
    "Gross-to-net parameters must be selected by the applicable income method.",
    "ZVW must use the period-specific contribution rate and contribution ceiling.",
    "Minimum-income inputs must be tied to the applicable period rather than copied from 2024+.",
    "A reference calculation must reproduce the documented 2023 formula before execution is enabled.",
    "Any missing category keeps the historical period fail-closed.",
  ] as const,
} as const;
