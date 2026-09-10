import { describe, expect, it } from "vitest";
import { effectiveRole } from "../lib/rbac";

describe("RBAC effective role", () => {
  it("always elevates explicit administrators", () => {
    expect(effectiveRole({ isAdmin: true, role: "PROFESSIONAL" })).toBe("ADMIN");
  });
  it("honors practice administrators", () => {
    expect(effectiveRole({ isAdmin: false, role: "PRACTICE_ADMIN" })).toBe("PRACTICE_ADMIN");
  });
  it("defaults unknown roles to professional", () => {
    expect(effectiveRole({ isAdmin: false, role: "UNKNOWN" })).toBe("PROFESSIONAL");
  });
});
