import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/calculations/trema-2027/route";

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn().mockResolvedValue({ id: "user-1", email: "test@example.com" }),
}));

describe("POST /api/calculations/trema-2027 route", () => {
  it("rejects invalid payload with status 400 and structured details", async () => {
    const req = new Request("http://localhost/api/calculations/trema-2027", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ referenceYear: 2026 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain("Ongeldige invoerparameters");
  });

  it("calculates 2027 support deterministically on valid payload", async () => {
    const payload = {
      referenceYear: 2027,
      ownShareMonthly: 600,
      payer: {
        id: "A",
        monthlyNbi: 3500,
        officialCapacityMonthly: 800,
      },
      recipient: {
        id: "B",
        monthlyNbi: 2000,
        officialCapacityMonthly: 200,
      },
      carePercentage: 0.25,
      careDiscountBaseMonthly: 600,
    };

    const req = new Request("http://localhost/api/calculations/trema-2027", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.result.referenceYear).toBe(2027);
    expect(body.result.payableMonthly).toBeGreaterThan(0);
    expect(body.result.engineVersion).toBe("4.0.0-trema-2027-contract");
  });
});
