import { SignJWT, jwtVerify } from "jose";

export type PortalSharePayload = {
  caseId: string;
  userId: string;
  purpose: "CLIENT_CASE";
};

function secret() {
  const value = process.env.PORTAL_SHARE_SECRET;
  if (!value || value.length < 32) throw new Error("PORTAL_SHARE_SECRET ontbreekt of is te kort.");
  return new TextEncoder().encode(value);
}

export async function createPortalToken(payload: PortalSharePayload, expiresIn = "7d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret());
}

export async function verifyPortalToken(token: string): Promise<PortalSharePayload> {
  const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
  if (payload.purpose !== "CLIENT_CASE" || typeof payload.caseId !== "string" || typeof payload.userId !== "string") {
    throw new Error("Ongeldige cliëntportal-token.");
  }
  return { caseId: payload.caseId, userId: payload.userId, purpose: "CLIENT_CASE" };
}
