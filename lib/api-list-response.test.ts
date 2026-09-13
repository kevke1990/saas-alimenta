import { describe, expect, it } from "vitest";
import { apiListResponse } from "./api-list-response";

describe("api list response", () => {
  it("returns a versioned paginated response with request correlation", async () => {
    const response = apiListResponse([{ id: "a" }, { id: "b" }, { id: "c" }], 2, (item) => item.id, "req-42");
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("req-42");
    await expect(response.json()).resolves.toEqual({
      data: [{ id: "a" }, { id: "b" }],
      pagination: { limit: 2, count: 2, nextCursor: "b" },
      apiVersion: "v1",
    });
  });
});
