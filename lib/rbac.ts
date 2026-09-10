import { requireUser } from "./auth";

export type Role = "PROFESSIONAL" | "PRACTICE_ADMIN" | "ADMIN";

export function effectiveRole(user: { role?: string | null; isAdmin?: boolean | null }): Role {
  if (user.isAdmin) return "ADMIN";
  if (user.role === "PRACTICE_ADMIN") return "PRACTICE_ADMIN";
  return "PROFESSIONAL";
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  const role = effectiveRole(user);
  if (!roles.includes(role)) throw new Error("FORBIDDEN");
  return user;
}
