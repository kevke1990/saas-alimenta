import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";
import { db } from "./db";
import { sessionCookieName, type ControlMode } from "./control-mode";
import { requireRuntimeSecret } from "./runtime-secrets";

function sessionSecret() { return new TextEncoder().encode(requireRuntimeSecret("SESSION_SECRET")); }

export function normalizeEmail(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[“”]/g, "")
    .replace(/[‘’]/g, "");
}

const secureCookies = process.env.APP_URL?.startsWith("https://") ?? process.env.NODE_ENV === "production";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const SESSION_ISSUER = "alimenta";
const SESSION_AUDIENCE = "alimenta-app";

export function hashSessionId(sessionId: string) {
  return createHash("sha256").update(sessionId).digest("hex");
}

export async function hashPassword(password: string) { return bcrypt.hash(password, 12); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }

export async function createSession(userId: string) {
  const sessionId = randomUUID();
  const token = await new SignJWT({ controlMode: "NORMAL" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setJti(sessionId)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(sessionSecret());

  await db.authSession.create({
    data: {
      id: randomUUID(),
      userId,
      tokenHash: hashSessionId(sessionId),
      controlMode: "NORMAL",
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    },
  });

  const jar = await cookies();
  jar.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, sessionSecret(), {
        algorithms: ["HS256"],
        issuer: SESSION_ISSUER,
        audience: SESSION_AUDIENCE,
      });
      if (typeof payload.jti === "string") {
        await db.authSession.updateMany({
          where: { tokenHash: hashSessionId(payload.jti), revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    } catch {}
  }
  jar.set(sessionCookieName(), "", {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "strict",
    expires: new Date(0),
    path: "/",
  });
}

export async function currentUser() {
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const sessionId = typeof payload.jti === "string" ? payload.jti : null;
    if (!userId || !sessionId) return null;

    const session = await db.authSession.findFirst({
      where: {
        tokenHash: hashSessionId(sessionId),
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!session) return null;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.lockedAt) return null;
    return user;
  } catch { return null; }
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function setSessionControlModeCookie(mode: ControlMode) {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (!token) throw new Error("UNAUTHORIZED");

  const { payload } = await jwtVerify(token, sessionSecret(), {
    algorithms: ["HS256"],
    issuer: SESSION_ISSUER,
    audience: SESSION_AUDIENCE,
  });
  const userId = typeof payload.sub === "string" ? payload.sub : null;
  const sessionId = typeof payload.jti === "string" ? payload.jti : null;
  const expiresAt = typeof payload.exp === "number" ? payload.exp : null;
  if (!userId || !sessionId || !expiresAt || expiresAt <= Math.floor(Date.now() / 1000)) throw new Error("UNAUTHORIZED");

  const nextToken = await new SignJWT({ controlMode: mode })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setJti(sessionId)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(sessionSecret());

  jar.set(sessionCookieName(), nextToken, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "strict",
    path: "/",
    maxAge: Math.max(0, expiresAt - Math.floor(Date.now() / 1000)),
  });
}

export async function requireAdmin() {
  const user = await requireUser();
  const configuredAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL || "");
  if (!(user.isAdmin || user.role === "ADMIN") || !configuredAdminEmail || normalizeEmail(user.email) !== configuredAdminEmail) throw new Error("FORBIDDEN");
  return user;
}
