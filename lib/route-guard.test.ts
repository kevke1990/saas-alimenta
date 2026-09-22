import { describe, expect, it } from "vitest";
import { isProtectedAppPath } from "./route-guard";

describe("route guard", () => {
  it("protects authenticated application areas", () => {
    expect(isProtectedAppPath("/clients")).toBe(true);
    expect(isProtectedAppPath("/clients/abc")).toBe(true);
    expect(isProtectedAppPath("/cases/abc/review")).toBe(true);
    expect(isProtectedAppPath("/work")).toBe(true);
    expect(isProtectedAppPath("/beheer")).toBe(true);
  });

  it("does not protect public application routes", () => {
    expect(isProtectedAppPath("/")).toBe(false);
    expect(isProtectedAppPath("/login")).toBe(false);
    expect(isProtectedAppPath("/register")).toBe(false);
    expect(isProtectedAppPath("/faq")).toBe(false);
    expect(isProtectedAppPath("/pricing")).toBe(false);
  });

  it("does not treat similar prefixes as protected", () => {
    expect(isProtectedAppPath("/clients-public")).toBe(false);
    expect(isProtectedAppPath("/cases-public")).toBe(false);
  });
});
