import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";

export const CLIENT_LIMITS: Record<Plan, number> = {
  FREE: 0,
  PRIVATE: 1,
  PRO: 5,
  PRACTICE: 5,
  ENTERPRISE: 5,
};

export async function getClientEntitlement(userId: string, plan: Plan) {
  const used = await db.client.count({ where: { userId, status: "ACTIVE" } });
  const limit = CLIENT_LIMITS[plan];
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
