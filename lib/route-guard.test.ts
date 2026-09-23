import { describe, expect, it } from "vitest";
import { isProtectedAppPath } from "./route-guard";

describe("route guard", () => {
  it("protects authenticated application areas", () => {
    for (const path of ["/dashboard","/work","/clients","/clients/abc","/cases/abc/review","/scan","/mail","/billing","/settings","/team","/tasks","/beheer"]) {
      expect(isProtectedAppPath(path)).toBe(true);
    }
  });

  it("does not protect public application routes", () => {
    for (const path of ["/","/login","/register","/faq","/pricing"]) {
      expect(isProtectedAppPath(path)).toBe(false);
    }
  });

  it("does not treat similar prefixes as protected", () => {
    expect(isProtectedAppPath("/clients-public")).toBe(false);
    expect(isProtectedAppPath("/cases-public")).toBe(false);
    expect(isProtectedAppPath("/mailing")).toBe(false);
  });
});
