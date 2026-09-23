import { describe, expect, it, vi } from "vitest";
import { MissingRuntimeSecretError, optionalRuntimeSecret, requireRuntimeSecret } from "./runtime-secrets";

describe("runtime secrets", () => {
  it("does not require a secret until it is explicitly requested", () => {
    const previous = process.env.STEP13_TEST_SECRET;
    delete process.env.STEP13_TEST_SECRET;

    expect(() => requireRuntimeSecret("STEP13_TEST_SECRET")).toThrow(MissingRuntimeSecretError);

    if (previous === undefined) delete process.env.STEP13_TEST_SECRET;
    else process.env.STEP13_TEST_SECRET = previous;
  });

  it("accepts a sufficiently long runtime secret", () => {
    process.env.STEP13_TEST_SECRET = "x".repeat(32);
    expect(requireRuntimeSecret("STEP13_TEST_SECRET")).toHaveLength(32);
    delete process.env.STEP13_TEST_SECRET;
  });

  it("returns null for an absent optional secret", () => {
    delete process.env.STEP13_OPTIONAL_SECRET;
    expect(optionalRuntimeSecret("STEP13_OPTIONAL_SECRET")).toBeNull();
  });

  it("does not expose secret values in validation errors", () => {
    process.env.STEP13_TEST_SECRET = "too-short-secret";
    expect(() => requireRuntimeSecret("STEP13_TEST_SECRET")).toThrow("STEP13_TEST_SECRET");
    expect(() => requireRuntimeSecret("STEP13_TEST_SECRET")).not.toThrow(/too-short-secret/);
    delete process.env.STEP13_TEST_SECRET;
  });
});
