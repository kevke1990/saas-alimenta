import { describe, expect, it } from "vitest";
import { reviewCase } from "./case-review";

describe("Case Review 0.9.10", () => {
  it("flags missing historical NBGI and unapproved documents", () => {
    const r = reviewCase({
      data: { parents: [{ nbi: 3000 }, { nbi: 2500 }], children: [{ age: 8 }] },
      documents: [{ aiStatus: "COMPLETED", approvedAt: null }],
      calculations: [],
      result: {},
    });
    expect(r.items.some(x => x.key === "history.nbgi" && x.severity === "WARNING")).toBe(true);
    expect(r.items.some(x => x.key === "documents.approval" && x.severity === "WARNING")).toBe(true);
    expect(r.items.some(x => x.key === "calculation.missing")).toBe(true);
  });

  it("does not invent a historical income warning when it is supplied", () => {
    const r = reviewCase({
      data: { historicalNBGI: 5000, parents: [{ nbi: 3000 }, { nbi: 2500 }], children: [{ age: 8 }] },
      documents: [],
      calculations: [{ id: "1" }],
      result: { warnings: [] },
    });
    expect(r.items.find(x => x.key === "history.nbgi")?.severity).toBe("OK");
    expect(r.readyForProfessionalReview).toBe(true);
  });

  it("flags young-adult review and other maintenance obligations", () => {
    const r = reviewCase({
      data: {
        parents: [{ nbi: 3000, otherMaintenance: 400 }, { nbi: 2500 }],
        children: [{ age: 19 }],
      },
      calculations: [{ id: "1" }],
      result: { warnings: ["check"] },
    });
    expect(r.items.some(x => x.key === "youngadult.review")).toBe(true);
    expect(r.items.some(x => x.key === "maintenance.other")).toBe(true);
    expect(r.items.some(x => x.key === "calculation.warnings")).toBe(true);
  });
});
