import { describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { $queryRaw: queryRaw },
}));

import { generateClientNumber } from "./client-number";

describe("tenant-scoped client numbering", () => {
  it("uses the database allocator for the tenant", async () => {
    queryRaw.mockResolvedValueOnce([{ customerNumber: "100001" }]);

    await expect(generateClientNumber("org-123")).resolves.toBe("100001");

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(String(queryRaw.mock.calls[0][0])).toContain('allocate_customer_number');
  });

  it("fails closed when the database returns no number", async () => {
    queryRaw.mockResolvedValueOnce([]);

    await expect(generateClientNumber("org-123")).rejects.toThrow("Kon geen uniek klantnummer genereren");
  });
});
