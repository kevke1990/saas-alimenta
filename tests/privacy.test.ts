import { describe, expect, it } from "vitest";
import { hashIp } from "../lib/privacy";

describe("privacy hashing", () => {
  it("never falls back to a public/default IP salt", () => {
    const previous = process.env.PRIVACY_HASH_SALT;
    delete process.env.PRIVACY_HASH_SALT;
    try {
      expect(hashIp("203.0.113.10")).toBeNull();
    } finally {
      if (previous === undefined) delete process.env.PRIVACY_HASH_SALT;
      else process.env.PRIVACY_HASH_SALT = previous;
    }
  });

  it("uses a sufficiently long configured salt", () => {
    const previous = process.env.PRIVACY_HASH_SALT;
    process.env.PRIVACY_HASH_SALT = "p".repeat(64);
    try {
      const first = hashIp("203.0.113.10");
      const second = hashIp("203.0.113.10");
      expect(first).toMatch(/^[a-f0-9]{64}$/);
      expect(second).toBe(first);
      expect(hashIp("203.0.113.11")).not.toBe(first);
    } finally {
      if (previous === undefined) delete process.env.PRIVACY_HASH_SALT;
      else process.env.PRIVACY_HASH_SALT = previous;
    }
  });
});
