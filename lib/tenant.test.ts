import { describe, expect, it } from "vitest";
import { assertTenantRole, TENANT_ROLES } from "./tenant";

describe("tenant RBAC contract", () => {
  it("keeps the four explicit organization roles", () => {
    expect(TENANT_ROLES).toEqual(["OWNER", "ADMIN", "PROFESSIONAL", "READ_ONLY"]);
  });

  it("enforces role hierarchy", () => {
    expect(() => assertTenantRole("OWNER", "ADMIN")).not.toThrow();
    expect(() => assertTenantRole("ADMIN", "PROFESSIONAL")).not.toThrow();
    expect(() => assertTenantRole("READ_ONLY", "PROFESSIONAL")).toThrow();
    expect(() => assertTenantRole("NOPE", "READ_ONLY")).toThrow();
  });
});
