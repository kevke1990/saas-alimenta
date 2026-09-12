import { describe, expect, it } from "vitest";
import { apiError, requestIdFromHeaders } from "./api-contract";

describe("api contract", () => {
  it("returns a stable error envelope", async () => {
    const response = apiError("VALIDATION_ERROR", "Invalid input", 422, {
      requestId: "req-123",
      details: { field: "name" },
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        requestId: "req-123",
        details: { field: "name" },
      },
    });
  });

  it("accepts bounded request IDs and rejects oversized values", () => {
    expect(requestIdFromHeaders(new Headers({ "x-request-id": " req-1 " }))).toBe("req-1");
    expect(requestIdFromHeaders(new Headers({ "x-request-id": "x".repeat(129) }))).toBeUndefined();
    expect(requestIdFromHeaders(new Headers())).toBeUndefined();
  });
});
