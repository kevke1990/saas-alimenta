import { describe, expect, it } from "vitest";
import { canRestoreCalculation, restoreCreatesNewSnapshot, restoredReviewStatus } from "./restore-policy";

describe("restore policy", () => {
  it("blocks restore for approved and final cases", () => {
    expect(canRestoreCalculation("APPROVED")).toBe(false);
    expect(canRestoreCalculation("FINAL")).toBe(false);
  });

  it("allows restore for open review states", () => {
    expect(canRestoreCalculation("INCOMPLETE")).toBe(true);
    expect(canRestoreCalculation("REVIEWED")).toBe(true);
    expect(canRestoreCalculation(null)).toBe(true);
  });

  it("always reopens review after restore", () => {
    expect(restoredReviewStatus()).toBe("INCOMPLETE");
  });

  it("requires a new immutable calculation snapshot", () => {
    expect(restoreCreatesNewSnapshot()).toBe(true);
  });
});
