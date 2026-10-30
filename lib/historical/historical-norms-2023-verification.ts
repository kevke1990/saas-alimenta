/**
 * Combined Phase H/I gate for the 2023 historical norm set.
 *
 * The set remains non-executable until every required parameter category is
 * verified. This prevents partially populated historical data from reaching
 * the calculation engine.
 */

import { HISTORICAL_NORM_2023 } from "./historical-norms-2023";

export const HISTORICAL_NORM_2023_REQUIRED_VERIFICATION = [
  "needTable",
  "capacity",
  "careDiscount",
  "wsf",
  "fiscalParameters",
  "socialPremiumParameters",
  "minimumIncome",
  "otherRequiredNormInputs",
] as const;

export type HistoricalNorm2023VerificationKey =
  (typeof HISTORICAL_NORM_2023_REQUIRED_VERIFICATION)[number];

export function isHistoricalNorm2023Verified(): boolean {
  return HISTORICAL_NORM_2023_REQUIRED_VERIFICATION.every(
    (key) => HISTORICAL_NORM_2023.verification[key] === "verified",
  );
}

export function assertHistoricalNorm2023Executable(): void {
  if (!isHistoricalNorm2023Verified()) {
    const pending = HISTORICAL_NORM_2023_REQUIRED_VERIFICATION.filter(
      (key) => HISTORICAL_NORM_2023.verification[key] !== "verified",
    );
    throw new Error(
      `Historical 2023 norm set is not executable; pending verification: ${pending.join(", ")}`,
    );
  }
}
