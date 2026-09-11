export type BillingPlan = "PRIVATE" | "PRO";

export const BILLING_ENTITLEMENTS: Record<BillingPlan, { activeCaseLimit: number }> = {
  PRIVATE: { activeCaseLimit: 1 },
  PRO: { activeCaseLimit: 5 },
};

export function activeCaseLimit(plan: string): number | null {
  if (plan === "PRIVATE" || plan === "PRO") return BILLING_ENTITLEMENTS[plan].activeCaseLimit;
  return null;
}

export function canCreateActiveCase(plan: string, activeCases: number) {
  const limit = activeCaseLimit(plan);
  return limit === null || activeCases < limit;
}

export function calculateVatInclusive(netCents: number, rate = 0.21) {
  const net = Math.max(0, Math.round(netCents));
  const vat = Math.round(net * rate);
  return { netCents: net, vatCents: vat, grossCents: net + vat };
}

export function calculateVatExclusive(grossCents: number, rate = 0.21) {
  const gross = Math.max(0, Math.round(grossCents));
  const net = Math.round(gross / (1 + rate));
  return { netCents: net, vatCents: gross - net, grossCents: gross };
}
