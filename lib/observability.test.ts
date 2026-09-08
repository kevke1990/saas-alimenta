import { describe, expect, it, vi } from "vitest";
import { logError, logInfo, logWarn, safeErrorMessage } from "./observability";

describe("observability", () => {
  it("writes structured JSON logs", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logInfo("TEST_EVENT", { userId: "u1", count: 2 });
    const payload = JSON.parse(spy.mock.calls[0][0] as string);
    expect(payload.service).toBe("alimenta-pro");
    expect(payload.level).toBe("info");
    expect(payload.event).toBe("TEST_EVENT");
    expect(payload.userId).toBe("u1");
    expect(payload.count).toBe(2);
    spy.mockRestore();
  });

  it("uses the correct log level", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logWarn("WARN_EVENT");
    logError("ERROR_EVENT");
    expect(JSON.parse(warn.mock.calls[0][0] as string).level).toBe("warn");
    expect(JSON.parse(error.mock.calls[0][0] as string).level).toBe("error");
    warn.mockRestore();
    error.mockRestore();
  });

  it("sanitizes error messages to a bounded string", () => {
    const error = new Error("x".repeat(1000));
    expect(safeErrorMessage(error)).toHaveLength(500);
    expect(safeErrorMessage("not-an-error")).toBe("Onbekende fout");
  });
});
