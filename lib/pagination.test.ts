import { describe, expect, it } from "vitest";
import { parsePageInput, toPageResult } from "./pagination";

describe("pagination", () => {
  it("uses defaults and clamps limits", () => {
    expect(parsePageInput({})).toEqual({ limit: 25, cursor: undefined });
    expect(parsePageInput({ limit: "999" }, { maxLimit: 50 })).toEqual({ limit: 50, cursor: undefined });
    expect(parsePageInput({ limit: "-2", cursor: "  abc  " })).toEqual({ limit: 1, cursor: "abc" });
    expect(parsePageInput({ limit: "not-a-number" })).toEqual({ limit: 25, cursor: undefined });
  });

  it("returns a cursor only when another page exists", () => {
    expect(toPageResult([{ id: "a" }, { id: "b" }], 2, (item) => item.id)).toEqual({
      items: [{ id: "a" }, { id: "b" }],
    });
    expect(toPageResult([{ id: "a" }, { id: "b" }, { id: "c" }], 2, (item) => item.id)).toEqual({
      items: [{ id: "a" }, { id: "b" }],
      nextCursor: "b",
    });
  });
});
