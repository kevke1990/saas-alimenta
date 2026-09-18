import { describe, expect, it } from "vitest";
import { resolveChildCostShare, resolveChildCostShareFromCaseResult } from "./combined-case-support";

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

  it("resolves the persisted combined child-cost-share shape", () => {
    const result = {
      combined: {
        childCostShareByParent: [734, 146],
        childSupportByParent: [512, 0],
      },
    };
    expect(resolveChildCostShareFromCaseResult(result, 0)?.childCostShare).toBe(734);
    expect(resolveChildCostShareFromCaseResult(result, 1)?.childCostShare).toBe(146);
  });

  it("returns null when a persisted result has no child calculation", () => {
    expect(resolveChildCostShareFromCaseResult({ combined: {} }, 0)).toBeNull();
  });

  it("handles a missing allocated share deterministically", () => {
    expect(resolveChildCostShare({ parentResults: [{}] }, 0).childCostShare).toBe(0);
  });

  it("maps the share by parentIndex even when result order is reversed", () => {
    const reversed = {
      parentResults: [
        { parentIndex: 1, allocatedNeed: 146 },
        { parentIndex: 0, allocatedNeed: 734 },
      ],
    };
    expect(resolveChildCostShare(reversed, 0).childCostShare).toBe(734);
    expect(resolveChildCostShare(reversed, 1).childCostShare).toBe(146);
  });
});
