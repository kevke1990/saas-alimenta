import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";

export const CLIENT_LIMITS: Record<Plan, number> = {
  FREE: 0,
  PRIVATE: 1,
  PRO: 5,
  PRACTICE: 50,
  ENTERPRISE: 500,
};

export async function getClientEntitlement(userId: string, plan: Plan, organizationId?: string) {
  const where = organizationId
    ? { organizationId, status: "ACTIVE" as const, deletedAt: null }
    : { userId, status: "ACTIVE" as const, deletedAt: null };
  const used = await db.client.count({ where });
  const limit = CLIENT_LIMITS[plan] ?? 0;
  return { allowed: used < limit, used, limit };
}

export function planDisplayName(plan: Plan) {
  return ({
    FREE: "Geen abonnement",
    PRIVATE: "Particulier",
    PRO: "Zakelijk",
    PRACTICE: "Zakelijk",
    ENTERPRISE: "Zakelijk",
  } satisfies Record<Plan, string>)[plan];
}
