import { describe, expect, it, vi } from "vitest";
import { persistCalculationRecord } from "./calculation-record";

describe("tenant-scoped calculation persistence", () => {
  it("persists the calculation under the resolved organization", async () => {
    const create = vi.fn().mockResolvedValue({ id: "calc-1", revision: 1 });
    const queryRaw = vi.fn().mockResolvedValue([{ revision: 1 }]);
    const tx = { calculation: { create }, $queryRaw: queryRaw } as any;

    const result = await persistCalculationRecord({
      tx,
      caseId: "case-1",
      organizationId: "org-1",
      userId: "user-1",
      engineVersion: "1.3.0",
      normVersion: "2026.1",
      inputSnapshot: { parents: [], children: [] },
      result: { totalNeed: 123 },
      inputHash: "input-hash",
      revision: 1,
    });

    expect(result).toEqual({ id: "calc-1", revision: 1 });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data).toMatchObject({
      caseId: "case-1",
      organizationId: "org-1",
      createdByUserId: "user-1",
      engineVersion: "1.3.0",
      normVersion: "2026.1",
      inputHash: "input-hash",
    });
    expect(create.mock.calls[0][0].data.resultHash).toMatch(/^[a-f0-9]{64}$/);
  });
});

  it("fails closed when the case cannot allocate a revision", async () => {
    const queryRaw = vi.fn().mockResolvedValue([]);
    const tx = { calculation: { create: vi.fn() }, $queryRaw: queryRaw } as any;

    await expect(persistCalculationRecord({
      tx,
      caseId: "case-1",
      organizationId: "org-1",
      userId: "user-1",
      engineVersion: "1.3.0",
      normVersion: "2026.1",
      inputSnapshot: {},
      result: {},
      inputHash: "hash",
    })).rejects.toThrow("Case not found or tenant mismatch");
  });
