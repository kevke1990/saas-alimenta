import { describe, expect, it } from "vitest";
import {
  CONTROL_MODES,
  ControlModeError,
  isSystemControlWriteAllowed,
  normalizeControlMode,
} from "./control-mode";

describe("server-side control mode", () => {
  it("supports normal and read-only modes", () => {
    expect(CONTROL_MODES).toEqual(["NORMAL", "READ_ONLY"]);
    expect(normalizeControlMode("READ_ONLY")).toBe("READ_ONLY");
    expect(normalizeControlMode("anything-else")).toBe("NORMAL");
  });

  it("uses a locked response for blocked writes", () => {
    expect(new ControlModeError().status).toBe(423);
  });

  it("allows only audit logging and current-session control writes as system exceptions", () => {
    expect(isSystemControlWriteAllowed("AuditLog", "create", {}, "hash")).toBe(true);
    expect(
      isSystemControlWriteAllowed(
        "AuthSession",
        "updateMany",
        { where: { tokenHash: "hash", revokedAt: null }, data: { revokedAt: new Date() } },
        "hash",
      ),
    ).toBe(true);
    expect(
      isSystemControlWriteAllowed(
        "AuthSession",
        "update",
        { where: { tokenHash: "hash" }, data: { controlMode: "NORMAL" } },
        "hash",
      ),
    ).toBe(true);
    expect(
      isSystemControlWriteAllowed(
        "User",
        "update",
        { where: { id: "user" }, data: { name: "changed" } },
        "hash",
      ),
    ).toBe(false);
  });
});
