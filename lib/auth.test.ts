import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.SESSION_SECRET = "test-session-secret-that-is-at-least-32-characters-long";
process.env.NODE_ENV = "test";

const { cookieGet, cookieSet, authSessionCreate, authSessionFindFirst, authSessionUpdateMany, userFindUnique } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  authSessionCreate: vi.fn(),
  authSessionFindFirst: vi.fn(),
  authSessionUpdateMany: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: cookieGet,
    set: cookieSet,
  })),
}));

vi.mock("./db", () => ({
  db: {
    authSession: {
      create: authSessionCreate,
      findFirst: authSessionFindFirst,
      updateMany: authSessionUpdateMany,
    },
    user: {
      findUnique: userFindUnique,
    },
  },
}));

const { createSession, currentUser, destroySession, hashSessionId } = await import("./auth");

describe("server-side authentication sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue(undefined);
    authSessionCreate.mockResolvedValue({});
    authSessionFindFirst.mockResolvedValue(null);
    authSessionUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("hashes session identifiers deterministically without storing the raw identifier", () => {
    expect(hashSessionId("session-123")).toBe(hashSessionId("session-123"));
    expect(hashSessionId("session-123")).not.toBe("session-123");
  });

  it("creates a database-backed session and sets an HttpOnly strict cookie", async () => {
    await createSession("user-1");

    expect(authSessionCreate).toHaveBeenCalledTimes(1);
    const session = authSessionCreate.mock.calls[0][0].data;
    expect(session.userId).toBe("user-1");
    expect(session.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(session.expiresAt).toBeInstanceOf(Date);
    expect(session.tokenHash).not.toContain("user-1");

    expect(cookieSet).toHaveBeenCalledTimes(1);
    const [name, token, options] = cookieSet.mock.calls[0];
    expect(name).toBe("ka_session");
    expect(token).toMatch(/^eyJ/);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "strict", path: "/", maxAge: 28800 });
  });

  it("accepts only a JWT with a matching active server-side session", async () => {
    let issuedToken = "";
    cookieSet.mockImplementation((_name: string, token: string) => { issuedToken = token; });
    await createSession("user-1");

    cookieGet.mockReturnValue({ value: issuedToken });
    authSessionFindFirst.mockResolvedValue({ id: "db-session", userId: "user-1" });
    userFindUnique.mockResolvedValue({ id: "user-1", lockedAt: null, email: "user@example.com" });

    await expect(currentUser()).resolves.toMatchObject({ id: "user-1" });
    expect(authSessionFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: "user-1", revokedAt: null }),
    }));
  });

  it("rejects a valid JWT after the server-side session is revoked or absent", async () => {
    let issuedToken = "";
    cookieSet.mockImplementation((_name: string, token: string) => { issuedToken = token; });
    await createSession("user-1");
    cookieGet.mockReturnValue({ value: issuedToken });
    authSessionFindFirst.mockResolvedValue(null);

    await expect(currentUser()).resolves.toBeNull();
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("revokes the active server-side session on logout", async () => {
    let issuedToken = "";
    cookieSet.mockImplementation((_name: string, token: string) => { issuedToken = token; });
    await createSession("user-1");
    cookieGet.mockReturnValue({ value: issuedToken });

    await destroySession();

    expect(authSessionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ revokedAt: null }),
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    }));
    expect(cookieSet).toHaveBeenLastCalledWith("ka_session", "", expect.objectContaining({ expires: expect.any(Date) }));
  });
});
