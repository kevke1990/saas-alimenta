import { describe, expect, it } from "vitest";
import {
  assertHistoricalNorm2023Executable,
  isHistoricalNorm2023Verified,
} from "./historical-norms-2023-verification";

describe("historical 2023 verification gate", () => {
  it("marks the fully sourced 2023 set executable", () => {
    expect(isHistoricalNorm2023Verified()).toBe(true);
    expect(() => assertHistoricalNorm2023Executable()).not.toThrow();
  });
});
