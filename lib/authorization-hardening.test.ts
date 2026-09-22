import { describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { $queryRaw: queryRaw } }));

import { assertRoleChangeAllowed } from "./tenant";
import { requireCaseTenantAccess, requireClientTenantAccess } from "./tenant-access";

describe("authorization hardening", () => {
  it("blocks cross-tenant case access", async () => {
    queryRaw.mockResolvedValueOnce([]);
    await expect(requireCaseTenantAccess("user-a", "case-b")).rejects.toMatchObject({ status: 403 });
  });

  it("blocks cross-tenant client access", async () => {
    queryRaw.mockResolvedValueOnce([]);
    await expect(requireClientTenantAccess("user-a", "client-b")).rejects.toMatchObject({ status: 403 });
  });

  it("allows same-tenant case access with sufficient role", async () => {
    queryRaw.mockResolvedValueOnce([{ caseId: "case-a", ownerUserId: "user-b", organizationId: "org-a", role: "PROFESSIONAL" }]);
    await expect(requireCaseTenantAccess("user-a", "case-a", "PROFESSIONAL")).resolves.toMatchObject({ organizationId: "org-a", role: "PROFESSIONAL" });
  });

  it("blocks read-only users from professional case mutations", async () => {
    queryRaw.mockResolvedValueOnce([{ caseId: "case-a", ownerUserId: "user-b", organizationId: "org-a", role: "READ_ONLY" }]);
    await expect(requireCaseTenantAccess("user-a", "case-a", "PROFESSIONAL")).rejects.toMatchObject({ status: 403 });
  });

  it("blocks an admin from assigning or changing the owner role", () => {
    expect(() => assertRoleChangeAllowed("ADMIN", "PROFESSIONAL", "OWNER")).toThrow();
    expect(() => assertRoleChangeAllowed("ADMIN", "OWNER", "ADMIN")).toThrow();
  });

  it("allows the owner to manage lower roles", () => {
    expect(assertRoleChangeAllowed("OWNER", "PROFESSIONAL", "READ_ONLY")).toBe(true);
    expect(assertRoleChangeAllowed("OWNER", "ADMIN", "PROFESSIONAL")).toBe(true);
  });

  it("rejects malformed roles", () => {
    expect(() => assertRoleChangeAllowed("NOPE", "PROFESSIONAL", "READ_ONLY")).toThrow();
    expect(() => assertRoleChangeAllowed("ADMIN", "PROFESSIONAL", "NOPE")).toThrow();
  });
});
