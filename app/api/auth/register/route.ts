import { NextResponse } from "next/server";
import { distributedRateLimit, requestKey } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { ensureTenant } from "@/lib/tenant";
import { sendVerificationEmail } from "@/lib/auth-mail";

export async function POST(req: Request) {
  const rl = await distributedRateLimit(requestKey(req, "register"), 5, 60 * 60 * 1000);
  if (!rl.ok) return new NextResponse("Te veel registratiepogingen. Probeer later opnieuw.", { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  try {
    const body = registerSchema.parse(await req.json());
    const email = body.email.toLowerCase();
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) return new NextResponse("E-mailadres bestaat al", { status: 409 });
    const user = await db.user.create({ data: { email, passwordHash: await hashPassword(body.password), name: body.name, companyName: body.companyName || null } });
    await ensureTenant(user);
    let verificationSent = false;
    try {
      await sendVerificationEmail(user);
      verificationSent = true;
    } catch {
      // Registration remains usable if mail is temporarily unavailable; the user can request verification again.
    }
    await createSession(user.id);
    return NextResponse.json({ id: user.id, verificationRequired: true, verificationSent });
  } catch (e: any) {
    return new NextResponse(e?.message || "Ongeldige invoer", { status: 400 });
  }
}
