import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, DELETE } from "../app/api/cases/[id]/route";
import { GET as PDF_GET } from "../app/api/cases/[id]/pdf/route";
import { POST as SECURITY_POST } from "../app/api/security/route";
import { requireSameOrigin } from "../lib/request-security";
import { caseCreateSchema } from "../lib/case-validation";
import { CLIENT_LIMITS } from "../lib/entitlements";
import * as auth from "../lib/auth";
import { db } from "../lib/db";
import { NextResponse } from "next/server";

vi.mock("../lib/auth");

describe("Tenant Isolation via Route Requests", () => {
  const caseAId = "case_A_id";
  const caseBId = "case_B_id";
  const userAId = "user_A_id";
  const userBId = "user_B_id";

  beforeEach(() => {
    vi.resetAllMocks();

    // Simulate DB raw query matching ONLY User A -> Case A, and User B -> Case B.
    vi.spyOn(db, '$queryRaw').mockImplementation((async (query: any) => {
      const sqlStr = query.strings?.join(" ") || "";
      const args = query.values || [];
      const queriedUserId = args[0];
      const queriedCaseId = args[1];

      // User A access Case A (PROFESSIONAL)
      if (queriedUserId === userAId && queriedCaseId === caseAId) {
        return [{ caseId: caseAId, ownerUserId: userAId, organizationId: "org1", role: "PROFESSIONAL" }];
      }
      // User B access Case B (READ_ONLY)
      if (queriedUserId === userBId && queriedCaseId === caseBId) {
        return [{ caseId: caseBId, ownerUserId: userBId, organizationId: "org2", role: "READ_ONLY" }];
      }
      // Everything else fails
      return [];
    }) as any);

    // Also mock findFirst so getCase and deleteCase don't fail when checking for existence
    vi.spyOn(db.case, 'findFirst').mockResolvedValue({ id: "case_X" } as any);
    vi.spyOn(db.case, 'update').mockResolvedValue({ id: "case_X" } as any);
  });

  it("denies User A access to Case B", async () => {
    vi.mocked(auth.requireUser).mockResolvedValue({ id: userAId } as any);
    const req = new Request(`http://localhost/api/cases/${caseBId}`);
    const res = await GET(req, { params: Promise.resolve({ id: caseBId }) });
    expect(res.status).toBe(403);
  });

  it("allows User A access to Case A", async () => {
    vi.mocked(auth.requireUser).mockResolvedValue({ id: userAId } as any);
    const req = new Request(`http://localhost/api/cases/${caseAId}`);
    const res = await GET(req, { params: Promise.resolve({ id: caseAId }) });
    expect((res as any).status).toBe(200);
  });

  it("allows User B access to Case B (READ_ONLY), but denies DELETE mutation", async () => {
    vi.mocked(auth.requireUser).mockResolvedValue({ id: userBId } as any);
    const reqGet = new Request(`http://localhost/api/cases/${caseBId}`);
    const resGet = await GET(reqGet, { params: Promise.resolve({ id: caseBId }) });
    expect((resGet as any).status).toBe(200);

    const reqDelete = new Request(`http://localhost/api/cases/${caseBId}`, { method: "DELETE" });
    const resDelete = await DELETE(reqDelete, { params: Promise.resolve({ id: caseBId }) });
    expect(resDelete.status).toBe(403); // READ_ONLY role correctly denies mutations
  });

  it("denies User B access to Case A PDF", async () => {
    vi.mocked(auth.requireUser).mockResolvedValue({ id: userBId } as any);
    const req = new Request(`http://localhost/api/cases/${caseAId}/pdf`);
    // Need to handle the fact that we mocked db.case.findFirst earlier which affects PDF_GET
    vi.spyOn(db.case, 'findFirst').mockResolvedValue(null as any);
    await expect(PDF_GET(req, { params: Promise.resolve({ id: caseAId }) })).rejects.toThrow();
  });

  it("blocks forging internal CASE_* or ADMIN_* actions on POST /api/security", async () => {
    vi.mocked(auth.requireUser).mockResolvedValue({ id: userAId } as any);
    const req = new Request("http://localhost/api/security", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "CASE_APPROVED", metadata: { caseId: caseAId } }),
    });
    const res = await SECURITY_POST(req);
    expect(res.status).toBe(403);
  });

  it("throws CROSS_ORIGIN_REQUEST instead of TypeError when Origin header is 'null'", () => {
    const prev = process.env.APP_URL;
    process.env.APP_URL = "https://app.example.test";
    try {
      const req = new Request("https://app.example.test/api/admin", {
        headers: { origin: "null" },
      });
      expect(() => requireSameOrigin(req)).toThrow("CROSS_ORIGIN_REQUEST");
    } finally {
      if (prev === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = prev;
    }
  });

  it("accepts extended wizard fields and empty strings in caseCreateSchema", () => {
    const parsed = caseCreateSchema.safeParse({
      name: "Test Dossier 2026",
      clientId: "",
      data: {
        relationship: "MARRIED",
        normYear: 2026,
        calculationDate: "2026-03-01",
        kgbParent: "A",
        actualKgbReceivingParent: "",
        parents: [
          {
            name: "Ouder A",
            nbi: 3500,
            newPartner: {
              present: true,
              relationship: "COHABITING",
              children: [{ age: 8, monthlyAmount: 150, ownIncome: 0 }],
            },
          },
          { name: "Ouder B", nbi: 2200 },
        ],
        children: [{ age: 6, residence: "A", careDaysPerWeek: 2 }],
        partnerSupport: {
          enabled: true,
          payerIndex: 0,
          concreteNeedNet: "",
        },
      },
      meta: { effectiveDate: "", separationDate: "2026-01-15" },
    });
    expect(parsed.success).toBe(true);
    expect(CLIENT_LIMITS.PRACTICE).toBeGreaterThan(5);
    expect(CLIENT_LIMITS.ENTERPRISE).toBeGreaterThan(50);
  });
});
