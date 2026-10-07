import { describe, expect, it, vi } from "vitest";
import { requireCaseTenantAccess, AuthorizationError } from "../lib/tenant-access";
import * as auth from "../lib/auth";

vi.mock("../lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("../lib/tenant-access", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/tenant-access")>();
  return {
    ...actual,
    requireCaseTenantAccess: vi.fn(actual.requireCaseTenantAccess),
  };
});

describe("Request-Level Authorization (mocked routes)", () => {
  it("denies access when a user attempts to read a case from another tenant", async () => {
    // Mock user
    vi.mocked(auth.requireUser).mockResolvedValue({ id: "user1", email: "user1@test.com" } as any);

    // Force requireCaseTenantAccess to throw AuthorizationError (cross-tenant)
    vi.mocked(requireCaseTenantAccess).mockRejectedValue(new AuthorizationError());

    // Import dynamically so mocks are picked up
    const { GET } = await import("../app/api/cases/[id]/route");

    const req = new Request("http://localhost/api/cases/case2");
    const res = await GET(req, { params: Promise.resolve({ id: "case2" }) });

    expect(res.status).toBe(403);
  });

  it("denies access when a READ_ONLY user attempts to delete a case", async () => {
    // Mock user
    vi.mocked(auth.requireUser).mockResolvedValue({ id: "user1", email: "user1@test.com" } as any);

    // Simulate failing the minimumRole="PROFESSIONAL" check for DELETE
    vi.mocked(requireCaseTenantAccess).mockImplementation(async (userId, caseId, minRole) => {
      if (minRole === "PROFESSIONAL") throw new AuthorizationError("Onvoldoende organisatierechten voor dit dossier.");
      return { caseId, ownerUserId: userId, organizationId: "org1", role: "READ_ONLY" };
    });

    const { DELETE } = await import("../app/api/cases/[id]/route");

    const req = new Request("http://localhost/api/cases/case1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "case1" }) });

    expect(res.status).toBe(403);
  });
});
