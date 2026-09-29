import { describe, expect, it } from "vitest";
import {
  assertHistoricalNorm2023Executable,
  isHistoricalNorm2023Verified,
} from "./historical-norms-2023-verification";

describe("historical 2023 verification gate", () => {
  it("keeps the partially verified 2023 set non-executable", () => {
    expect(isHistoricalNorm2023Verified()).toBe(false);
    expect(() => assertHistoricalNorm2023Executable()).toThrow(
      /otherRequiredNormInputs/,
    );
  });
});
