import { describe, expect, it } from "vitest";
import { assertTenantRole } from "./tenant";

describe("tenant case access roles", () => {
  it("allows professional dossier work", () => expect(assertTenantRole("PROFESSIONAL", "PROFESSIONAL")).toBe(true));
  it("allows admins to perform professional work", () => expect(assertTenantRole("ADMIN", "PROFESSIONAL")).toBe(true));
  it("rejects read-only users for professional work", () => expect(() => assertTenantRole("READ_ONLY", "PROFESSIONAL")).toThrow());
  it("rejects unknown roles", () => expect(() => assertTenantRole("UNKNOWN", "READ_ONLY")).toThrow());
});
