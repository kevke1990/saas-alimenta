import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";

const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret || rawSecret.length < 32) throw new Error("SESSION_SECRET must be set and contain at least 32 characters");
const secret = new TextEncoder().encode(rawSecret);

const secureCookies = process.env.APP_URL?.startsWith("https://") ?? process.env.NODE_ENV === "production";
const sessionCookieName = secureCookies ? "__Host-ka_session" : "ka_session";

export async function hashPassword(password: string) { return bcrypt.hash(password, 12); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret);
  const jar = await cookies();
  jar.set(sessionCookieName, token, { httpOnly: true, secure: secureCookies, sameSite: "strict", path: "/", maxAge: 60 * 60 * 8 });
}

export async function destroySession() {
  const jar = await cookies();
  jar.set(sessionCookieName, "", { httpOnly: true, secure: secureCookies, sameSite: "strict", expires: new Date(0), path: "/" });
}

export async function currentUser() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const userId = String(payload.userId);
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
