process.env.APP_ENCRYPTION_KEY = "test-encryption-key-012345678901234567890123456789";

import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./secrets";

describe("secret encryption", () => {
  it("round-trips secrets without storing plaintext", () => {
    const value = "webhook-secret-value";
    const cipher = encryptSecret(value);
    expect(cipher).not.toContain(value);
    expect(cipher.split(".")).toHaveLength(3);
    expect(decryptSecret(cipher)).toBe(value);
  });

  it("rejects tampered ciphertext", () => {
    const cipher = encryptSecret("sensitive");
    const parts = cipher.split(".");
    const last = parts[2];
    parts[2] = `${last.slice(0, -1)}${last.endsWith("A") ? "B" : "A"}`;
    expect(() => decryptSecret(parts.join("."))).toThrow();
  });
});
