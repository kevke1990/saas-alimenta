import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptSecret, verifyTotp } from "@/lib/totp";
import { distributedRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const rate = await distributedRateLimit(`mfa:disable:${u.id}`, 10, 15 * 60 * 1000);
    if (!rate.ok) {
      return new NextResponse("Te veel MFA-pogingen. Probeer het later opnieuw.", {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      });
    }
    if (!u.mfaEnabled || !u.mfaSecretCipher) return NextResponse.json({ ok: true });
    const { code } = await req.json();
    if (!verifyTotp(decryptSecret(u.mfaSecretCipher), String(code))) {
      return new NextResponse("Ongeldige MFA-code", { status: 401 });
    }
    await db.user.update({ where: { id: u.id }, data: { mfaEnabled: false, mfaSecretCipher: null } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return new NextResponse(e?.message || "MFA uitschakelen mislukt", { status: e?.message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
