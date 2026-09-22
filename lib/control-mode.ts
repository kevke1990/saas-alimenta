import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createHash } from "node:crypto";

export const CONTROL_MODES = ["NORMAL", "READ_ONLY"] as const;
export type ControlMode = (typeof CONTROL_MODES)[number];

export class ControlModeError extends Error {
  readonly status = 423;
  constructor(message = "Deze sessie staat in alleen-lezenmodus. Schrijfacties zijn geblokkeerd.") {
    super(message);
    this.name = "ControlModeError";
  }
}

const SESSION_ISSUER = "alimenta";
const SESSION_AUDIENCE = "alimenta-app";

function getSecret() {
  const rawSecret = process.env.SESSION_SECRET;
  if (!rawSecret || rawSecret.length < 32) {
    throw new Error("SESSION_SECRET must be set and contain at least 32 characters");
  }
  return new TextEncoder().encode(rawSecret);
}

export function sessionCookieName() {
  const secureCookies =
    process.env.APP_URL?.startsWith("https://") ?? process.env.NODE_ENV === "production";
  return secureCookies ? "__Host-ka_session" : "ka_session";
}

export function normalizeControlMode(value: unknown): ControlMode {
  return value === "READ_ONLY" ? "READ_ONLY" : "NORMAL";
}

export async function getSessionContext() {
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) return { sessionHash: null as string | null, userId: null as string | null, claimedMode: "NORMAL" as const };

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });
    const jti = typeof payload.jti === "string" ? payload.jti : null;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    if (!jti || !userId) return { sessionHash: null, userId: null, claimedMode: "NORMAL" as const };
    return {
      sessionHash: createHash("sha256").update(jti).digest("hex"),
      userId,
      claimedMode: normalizeControlMode(payload.controlMode),
    };
  } catch {
    return { sessionHash: null, userId: null, claimedMode: "NORMAL" as const };
  }
}

export async function assertWritableControlMode() {
  throw new ControlModeError();
}

export function isSystemControlWriteAllowed(
  model: string | undefined,
  operation: string,
  args: any,
  sessionHash: string | null,
) {
  if (model === "AuditLog" && operation === "create") return true;

  if (model === "AuthSession" && ["update", "updateMany"].includes(operation) && sessionHash) {
    const where = args?.where;
    const targetHash = where?.tokenHash;
    const data = args?.data;
    const keys = data && typeof data === "object" ? Object.keys(data) : [];
    if (targetHash !== sessionHash || keys.length !== 1) return false;
    return keys[0] === "revokedAt" || keys[0] === "controlMode";
  }

  return false;
}
