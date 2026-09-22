import { beforeEach, describe, expect, it, vi } from "vitest";

const { auditCreate, memberFindFirst } = vi.hoisted(() => ({
  auditCreate: vi.fn(),
  memberFindFirst: vi.fn(),
}));

vi.mock("./db", () => ({
  db: {
    auditLog: { create: auditCreate },
    organizationMember: { findFirst: memberFindFirst },
  },
}));

vi.mock("./tenant", () => ({
  ensureTenant: vi.fn(),
  TENANT_ROLES: ["OWNER", "ADMIN", "PROFESSIONAL", "READ_ONLY"],
}));

const { auditSecurity } = await import("./team-security");

describe("server-side audit log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memberFindFirst.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  it("derives tenant and actor role from server-side membership", async () => {
    await auditSecurity("user-1", "CONTROL_MODE_CHANGED", { mode: "READ_ONLY" });

    expect(memberFindFirst).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { organizationId: true, role: true },
    });
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        organizationId: "org-1",
        actorRole: "ADMIN",
        action: "CONTROL_MODE_CHANGED",
        metadata: { mode: "READ_ONLY" },
      }),
    });
  });

  it("fails closed when an actor has no tenant membership", async () => {
    memberFindFirst.mockResolvedValue(null);

    await expect(auditSecurity("user-without-tenant", "SECURITY_EVENT", {})).rejects.toThrow(
      "AUDIT_ACTOR_TENANT_MISSING",
    );
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("does not accept caller-supplied tenant or actor fields as authoritative", async () => {
    await auditSecurity("user-1", "TEAM_ROLE_CHANGED", {
      organizationId: "attacker-org",
      actorRole: "OWNER",
      targetUserId: "user-2",
    });

    const data = auditCreate.mock.calls[0][0].data;
    expect(data.organizationId).toBe("org-1");
    expect(data.actorRole).toBe("ADMIN");
    expect(data.metadata).toEqual({
      organizationId: "attacker-org",
      actorRole: "OWNER",
      targetUserId: "user-2",
    });
  });
});
