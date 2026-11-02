import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptSecret, generateSecret } from "@/lib/totp";

export async function POST() {
  try {
    const u = await requireUser();
    if (u.mfaEnabled) {
      return new NextResponse("MFA is al ingeschakeld. Schakel MFA eerst uit met een geldige code.", { status: 409 });
    }
    const secret = generateSecret();
    await db.user.update({ where: { id: u.id }, data: { mfaSecretCipher: encryptSecret(secret) } });
    const issuer = process.env.APP_NAME || "Merelo";
    const label = encodeURIComponent(`${issuer}:${u.email}`);
    const uri = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    return NextResponse.json({ secret, otpauthUri: uri });
  } catch (e: any) {
    return new NextResponse(e?.message || "MFA instellen mislukt", { status: e?.message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
