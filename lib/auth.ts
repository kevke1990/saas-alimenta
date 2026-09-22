import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";
import { db } from "./db";

const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret || rawSecret.length < 32) throw new Error("SESSION_SECRET must be set and contain at least 32 characters");
const secret = new TextEncoder().encode(rawSecret);

const secureCookies = process.env.APP_URL?.startsWith("https://") ?? process.env.NODE_ENV === "production";
const sessionCookieName = secureCookies ? "__Host-ka_session" : "ka_session";
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
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setJti(sessionId)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL_SECONDS)
    .sign(secret);

  await db.authSession.create({
    data: {
      id: randomUUID(),
      userId,
      tokenHash: hashSessionId(sessionId),
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    },
  });

  const jar = await cookies();
  jar.set(sessionCookieName, token, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(sessionCookieName)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret, {
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
    } catch {
      // The cookie is cleared even when the token is already invalid or expired.
    }
  }
  jar.set(sessionCookieName, "", {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "strict",
    expires: new Date(0),
    path: "/",
  });
}

export async function currentUser() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
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

export async function requireAdmin() {
  const user = await requireUser();
  if (!(user.isAdmin || user.role === "ADMIN") || user.email !== process.env.ADMIN_EMAIL?.toLowerCase()) throw new Error("FORBIDDEN");
  return user;
}
