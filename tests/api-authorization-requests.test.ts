import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, DELETE } from "../app/api/cases/[id]/route";
import * as auth from "../lib/auth";
import { db } from "../lib/db";
import { NextResponse } from "next/server";
import * as caseRouteV2 from "../lib/case-route-v2";

vi.mock("../lib/auth");

vi.mock("../lib/case-route-v2", () => ({
  getCase: vi.fn(),
  deleteCase: vi.fn(),
  patchCase: vi.fn(),
}));

describe("Real Tenant Authorization via DB mocking", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(caseRouteV2.getCase).mockResolvedValue(new NextResponse("OK", { status: 200 }));
    vi.mocked(caseRouteV2.deleteCase).mockResolvedValue(new NextResponse("DELETED", { status: 200 }));
  });

  it("denies access cross-tenant", async () => {
    vi.mocked(auth.requireUser).mockResolvedValue({ id: "user1", email: "u@t.com" } as any);
    vi.spyOn(db, '$queryRaw').mockResolvedValue([]);

    const req = new Request("http://localhost/api/cases/case1");
    const res = await GET(req, { params: Promise.resolve({ id: "case1" }) });

    expect(res.status).toBe(403);
  });

  it("allows access same-tenant for READ_ONLY on GET", async () => {
    vi.mocked(auth.requireUser).mockResolvedValue({ id: "user1", email: "u@t.com" } as any);
    vi.spyOn(db, '$queryRaw').mockResolvedValue([
      { caseId: "case1", ownerUserId: "user1", organizationId: "org1", role: "READ_ONLY" }
    ]);

    const req = new Request("http://localhost/api/cases/case1");
    const res = await GET(req, { params: Promise.resolve({ id: "case1" }) });

    expect(res?.status).toBe(200);
  });

  it("denies access same-tenant for READ_ONLY on DELETE", async () => {
    vi.mocked(auth.requireUser).mockResolvedValue({ id: "user1", email: "u@t.com" } as any);
    vi.spyOn(db, '$queryRaw').mockResolvedValue([
      { caseId: "case1", ownerUserId: "user1", organizationId: "org1", role: "READ_ONLY" }
    ]);

    const req = new Request("http://localhost/api/cases/case1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "case1" }) });

    expect(res.status).toBe(403);
  });

  it("allows access same-tenant for PROFESSIONAL on DELETE", async () => {
    vi.mocked(auth.requireUser).mockResolvedValue({ id: "user1", email: "u@t.com" } as any);
    vi.spyOn(db, '$queryRaw').mockResolvedValue([
      { caseId: "case1", ownerUserId: "user1", organizationId: "org1", role: "PROFESSIONAL" }
    ]);

    const req = new Request("http://localhost/api/cases/case1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "case1" }) });

    expect(res?.status).toBe(200);
  });
});
