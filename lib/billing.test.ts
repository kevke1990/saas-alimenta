import { describe, expect, it } from "vitest";
import {
  activeCaseLimit,
  assertCanCreateCase,
  calculateVatExclusive,
  calculateVatInclusive,
  canCreateActiveCase,
  hasPaidEntitlement,
} from "./billing";
import fs from "node:fs";
import path from "node:path";

describe("billing entitlement matrix", () => {
  it("defines the server-side active-case limits", () => {
    expect(activeCaseLimit("PRIVATE")).toBe(1);
    expect(activeCaseLimit("PRO")).toBe(5);
    expect(activeCaseLimit("FREE")).toBeNull();
  });

  it("keeps paid entitlement status explicit", () => {
    expect(hasPaidEntitlement("PRIVATE", "ACTIVE")).toBe(true);
    expect(hasPaidEntitlement("PRIVATE", "TRIALING")).toBe(true);
    expect(hasPaidEntitlement("PRIVATE", "PAST_DUE")).toBe(true);
    expect(hasPaidEntitlement("PRIVATE", "CANCELED")).toBe(false);
    expect(hasPaidEntitlement("FREE", null)).toBe(false);
    expect(hasPaidEntitlement("ENTERPRISE", null)).toBe(true);
  });

  it("enforces plan capacity server-side", () => {
    expect(canCreateActiveCase("PRIVATE", 0)).toBe(true);
    expect(canCreateActiveCase("PRIVATE", 1)).toBe(false);
    expect(canCreateActiveCase("PRO", 4)).toBe(true);
    expect(canCreateActiveCase("PRO", 5)).toBe(false);
  });

  it("locks the organization before counting active cases on the transaction client", async () => {
    const calls: string[] = [];
    const tx = {
      $queryRaw: async () => { calls.push("lock"); return [{ id: "org-1" }]; },
      user: { findUnique: async () => { calls.push("user"); return { plan: "PRIVATE", subscriptionStatus: "ACTIVE", subscriptionEndsAt: null }; } },
      case: { count: async () => { calls.push("count"); return 0; } },
    } as any;

    await expect(assertCanCreateCase(tx, "user-1", "org-1")).resolves.toMatchObject({ paid: true });
    expect(calls).toEqual(["lock", "user", "count"]);
  });

  it("preserves existing VAT arithmetic", () => {
    expect(calculateVatInclusive(10000)).toEqual({ netCents: 10000, vatCents: 2100, grossCents: 12100 });
    expect(calculateVatExclusive(12100)).toEqual({ netCents: 10000, vatCents: 2100, grossCents: 12100 });
  });

  it("keeps Stripe webhook mutation inside a transaction without post-claim deletion", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app", "api", "stripe", "webhook", "route.ts"),
      "utf8",
    );
    expect(source).toContain("db.$transaction");
    expect(source).toContain("tx.stripeEvent.create");
    expect(source).not.toContain("stripeEvent.delete");
  });
});
