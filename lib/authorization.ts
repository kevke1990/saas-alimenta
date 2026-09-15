import type { User } from "@prisma/client";

/**
 * Application roles used by the tenant/workspace authorization layer.
 *
 * Existing accounts remain compatible because the Prisma User.role field is
 * currently a string. Unknown values intentionally fall back to PROFESSIONAL.
 */
export const ROLES = [
  "OWNER",
  "ADMIN",
  "PROFESSIONAL",
  "REVIEWER",
  "ASSISTANT",
  "READ_ONLY",
] as const;

export type AppRole = (typeof ROLES)[number];

export function normalizeRole(value: unknown): AppRole {
  const role = String(value ?? "").trim().toUpperCase();
  return (ROLES as readonly string[]).includes(role)
    ? (role as AppRole)
    : "PROFESSIONAL";
}

const permissions = {
  OWNER: ["tenant:manage", "members:manage", "billing:manage", "cases:write", "cases:read", "reports:write", "settings:write"],
  ADMIN: ["tenant:manage", "members:manage", "billing:manage", "cases:write", "cases:read", "reports:write", "settings:write"],
  PROFESSIONAL: ["cases:write", "cases:read", "reports:write"],
  REVIEWER: ["cases:read", "cases:review", "reports:read"],
  ASSISTANT: ["cases:read", "cases:write", "documents:write", "tasks:write"],
  READ_ONLY: ["cases:read", "reports:read"],
} as const satisfies Record<AppRole, readonly string[]>;

export type Permission = (typeof permissions)[AppRole][number];

export function hasPermission(user: Pick<User, "role" | "isAdmin">, permission: string): boolean {
  if (user.isAdmin) return true;
  const role = normalizeRole(user.role);
  return (permissions[role] as readonly string[]).includes(permission);
}

export function canReadCases(user: Pick<User, "role" | "isAdmin">) {
  return hasPermission(user, "cases:read");
}

export function canWriteCases(user: Pick<User, "role" | "isAdmin">) {
  return hasPermission(user, "cases:write");
}

export function canReviewCases(user: Pick<User, "role" | "isAdmin">) {
  return hasPermission(user, "cases:review");
}

export function canManageMembers(user: Pick<User, "role" | "isAdmin">) {
  return hasPermission(user, "members:manage");
}
