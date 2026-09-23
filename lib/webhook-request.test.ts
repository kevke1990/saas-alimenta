import { describe, expect, it } from "vitest";
import { webhookRequestBody } from "./webhook-request";

describe("webhook request body", () => {
  it("preserves an already signed JSON string byte-for-byte", () => {
    const payload = '{"event":"case.updated","spacing": true}\n';
    expect(webhookRequestBody(payload)).toBe(payload);
  });

  it("serializes non-string payloads once", () => {
    expect(webhookRequestBody({ event: "case.updated" })).toBe('{"event":"case.updated"}');
  });
});
