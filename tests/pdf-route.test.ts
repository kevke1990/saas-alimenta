import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "../app/api/cases/[id]/pdf/route";
import * as auth from "../lib/auth";
import { db } from "../lib/db";
import { requireCaseTenantAccess } from "../lib/tenant-access";
import { buildReviewCalculationBinding } from "../lib/review-binding";
import { execSync } from "child_process";

vi.mock("../lib/auth");
vi.mock("../lib/tenant-access");

vi.mock("../lib/db", () => ({
  db: {
    case: { findFirst: vi.fn() },
    auditLog: { findFirst: vi.fn() },
  }
}));

function extractText(pdfBuffer: Buffer): string {
  return execSync("pdftotext - -", { input: pdfBuffer }).toString("utf-8");
}

describe("PDF Route Export states", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(auth.requireUser).mockResolvedValue({ id: "user1", name: "User" } as any);
    vi.mocked(requireCaseTenantAccess).mockResolvedValue({ organizationId: "org1" } as any);
  });

  it("exports DRAFT when case has no approvedAt", async () => {
    vi.mocked(db.case.findFirst).mockResolvedValue({
      id: "case1",
      name: "Case 1",
      approvedAt: null,
      calculations: [{ id: "calc1", engineVersion: "2026", normVersion: "2026", result: {} }]
    } as any);

    const req = new Request("http://localhost");
    const res = await GET(req, { params: Promise.resolve({ id: "case1" }) });
    const buffer = Buffer.from(await res.arrayBuffer());
    const text = extractText(buffer);

    expect(text).toContain("CONCEPT / NIET GOEDGEKEURD");
  });

  it("exports DRAFT when binding is missing from audit log", async () => {
    vi.mocked(db.case.findFirst).mockResolvedValue({
      id: "case1",
      name: "Case 1",
      approvedAt: new Date(),
      calculations: [{ id: "calc1", engineVersion: "2026", normVersion: "2026", result: {} }]
    } as any);

    vi.mocked(db.auditLog.findFirst).mockResolvedValue(null as any);

    const req = new Request("http://localhost");
    const res = await GET(req, { params: Promise.resolve({ id: "case1" }) });
    const buffer = Buffer.from(await res.arrayBuffer());
    const text = extractText(buffer);

    expect(text).toContain("CONCEPT / NIET GOEDGEKEURD");
  });

  it("exports DRAFT when binding is stale or does not match current calculation", async () => {
    const calc = { id: "calc1", engineVersion: "2026", normVersion: "2026", result: {} };
    vi.mocked(db.case.findFirst).mockResolvedValue({
      id: "case1",
      name: "Case 1",
      approvedAt: new Date(),
      calculations: [calc]
    } as any);

    vi.mocked(db.auditLog.findFirst).mockResolvedValue({
      metadata: { calculationBinding: { calculationId: "calc1", fingerprint: "old-fingerprint" } }
    } as any);

    const req = new Request("http://localhost");
    const res = await GET(req, { params: Promise.resolve({ id: "case1" }) });
    const buffer = Buffer.from(await res.arrayBuffer());
    const text = extractText(buffer);

    expect(text).toContain("CONCEPT / NIET GOEDGEKEURD");
  });

  it("exports APPROVED when binding matches perfectly", async () => {
    const calc = { id: "calc1", engineVersion: "2026", normVersion: "2026", result: {} };
    vi.mocked(db.case.findFirst).mockResolvedValue({
      id: "case1",
      name: "Case 1",
      approvedAt: new Date(),
      calculations: [calc]
    } as any);

    const validBinding = buildReviewCalculationBinding(calc as any);

    vi.mocked(db.auditLog.findFirst).mockResolvedValue({
      metadata: { calculationBinding: validBinding }
    } as any);

    const req = new Request("http://localhost");
    const res = await GET(req, { params: Promise.resolve({ id: "case1" }) });
    const buffer = Buffer.from(await res.arrayBuffer());
    const text = extractText(buffer);

    expect(text).not.toContain("CONCEPT / NIET GOEDGEKEURD");
    expect(text).toContain("Alimentatieberekening");
  });

  it("exports DRAFT when there is no calculation at all", async () => {
    vi.mocked(db.case.findFirst).mockResolvedValue({
      id: "case1",
      name: "Case 1",
      approvedAt: new Date(),
      calculations: []
    } as any);

    const req = new Request("http://localhost");
    const res = await GET(req, { params: Promise.resolve({ id: "case1" }) });
    const buffer = Buffer.from(await res.arrayBuffer());
    const text = extractText(buffer);

    expect(text).toContain("CONCEPT / NIET GOEDGEKEURD");
  });
});
