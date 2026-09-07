import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";

export const CLIENT_LIMITS: Record<Plan, number> = {
  FREE: 1,
  PRO: 5,
  PRACTICE: 20,
  ENTERPRISE: Number.MAX_SAFE_INTEGER,
};

export async function getClientEntitlement(userId: string, plan: Plan) {
  const used = await db.client.count({ where: { userId, status: "ACTIVE" } });
  const limit = CLIENT_LIMITS[plan];
  return { allowed: used < limit, used, limit };
}

export function planDisplayName(plan: Plan) {
  return ({ FREE: "Free", PRO: "Professional", PRACTICE: "Practice", ENTERPRISE: "Enterprise" } satisfies Record<Plan, string>)[plan];
}
