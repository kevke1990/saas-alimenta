import { describe, expect, it } from "vitest";
import { resolveChildCostShare } from "./combined-case-support";

describe("integrated child cost share", () => {
  const childResult = {
    parentResults: [
      { parentIndex: 0, allocatedNeed: 734, paymentTotal: 512 },
      { parentIndex: 1, allocatedNeed: 146, paymentTotal: 0 },
    ],
  };

  it("uses allocated child costs, not the transfer/payment amount", () => {
    const r = resolveChildCostShare(childResult, 0);
    expect(r.childCostShare).toBe(734);
    expect(r.childCostShare).not.toBe(childResult.parentResults[0].paymentTotal);
    expect(r.source).toBe("CHILD_CALCULATION");
  });

  it("uses an explicit professional override and records its provenance", () => {
    const r = resolveChildCostShare(childResult, 0, 600);
    expect(r.childCostShare).toBe(600);
    expect(r.source).toBe("MANUAL_OVERRIDE");
  });

  it("rejects invalid overrides and falls back to the child calculation", () => {
    expect(resolveChildCostShare(childResult, 0, -1).childCostShare).toBe(734);
    expect(resolveChildCostShare(childResult, 0, "not-a-number").childCostShare).toBe(734);
    expect(resolveChildCostShare(childResult, 0).source).toBe("CHILD_CALCULATION");
  });

  it("handles a missing allocated share deterministically", () => {
    expect(resolveChildCostShare({ parentResults: [{}] }, 0).childCostShare).toBe(0);
  });
});
