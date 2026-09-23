import { db } from "@/lib/db";

export type BillingPlan = "PRIVATE" | "PRO";
export type BillingStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";

export const BILLING_ENTITLEMENTS: Record<BillingPlan, { activeCaseLimit: number }> = {
  PRIVATE: { activeCaseLimit: 1 },
  PRO: { activeCaseLimit: 5 },
};

export class BillingEntitlementError extends Error {
  readonly status = 402;
  readonly code = "BILLING_ENTITLEMENT_REQUIRED";
  constructor(message = "Een actief abonnement is vereist voor deze functie.") {
    super(message);
    this.name = "BillingEntitlementError";
  }
}

export function activeCaseLimit(plan: string): number | null {
  if (plan === "PRIVATE" || plan === "PRO") return BILLING_ENTITLEMENTS[plan].activeCaseLimit;
  return null;
}

export function hasPaidEntitlement(plan: string, status?: string | null): boolean {
  if (plan === "PRACTICE" || plan === "ENTERPRISE") return true;
  if (plan !== "PRIVATE" && plan !== "PRO") return false;
  return status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE";
}

export function canCreateActiveCase(plan: string, activeCases: number) {
  const limit = activeCaseLimit(plan);
  return limit === null || activeCases < limit;
}

export async function getServerBillingEntitlement(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true },
  });
  if (!user) throw new BillingEntitlementError("Gebruiker niet gevonden.");

  const limit = activeCaseLimit(user.plan);
  return {
    plan: user.plan,
    status: user.subscriptionStatus,
    subscriptionEndsAt: user.subscriptionEndsAt,
    paid: hasPaidEntitlement(user.plan, user.subscriptionStatus),
    activeCaseLimit: limit,
  };
}

export async function assertCanCreateCase(userId: string, organizationId: string) {
  const entitlement = await getServerBillingEntitlement(userId);
  if (!entitlement.paid) throw new BillingEntitlementError();

  if (entitlement.activeCaseLimit !== null) {
    const activeCases = await db.case.count({
      where: {
        organizationId,
        deletedAt: null,
        status: { not: "ARCHIVED" },
      },
    });
    if (!canCreateActiveCase(entitlement.plan, activeCases)) {
      throw new BillingEntitlementError("De limiet voor actieve dossiers van je abonnement is bereikt.");
    }
  }

  return entitlement;
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
