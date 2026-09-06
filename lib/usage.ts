import { db } from "./db";
import { Plan } from "@prisma/client";

const LIMITS: Record<Plan, number> = {
  FREE: 1,
  PRO: 5,
  PRACTICE: 20,
  ENTERPRISE: 999999
};

export async function canCreateClient(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, include: { clients: true } });
  if (!user) return false;
  if (user.plan === "PRO") return true; // extra client billing handled separately
  return user.clients.length < LIMITS[user.plan];
}

export async function recordUsage(userId: string, type: string, clientId?: string, metadata?: unknown) {
  return db.usageEvent.create({ data: { userId, clientId, type, metadata: metadata as any } });
}
