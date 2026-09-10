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
    if (exists) return NextResponse.json({ error: "E-mailadres bestaat al" }, { status: 409 });

    const plan = body.accountType === "PRIVATE" ? "PRIVATE" : "PRO";
    const user = await db.user.create({
      data: {
        email,
        passwordHash: await hashPassword(body.password),
        name: body.name,
        companyName: body.companyName || null,
        accountType: body.accountType,
        phone: body.phone || null,
        addressLine1: body.addressLine1,
        postalCode: body.postalCode,
        city: body.city,
        country: body.country,
        kvkNumber: body.kvkNumber || null,
        vatNumber: body.vatNumber || null,
        website: body.website || null,
        practiceType: body.practiceType || (body.accountType === "PRIVATE" ? "Particulier" : null),
        plan,
      },
    });
    await ensureTenant(user);
    await db.branding.create({ data: { userId: user.id, companyName: body.companyName || body.name, reportTitle: "Alimenta Pro" } });
    let verificationSent = false;
    try { await sendVerificationEmail(user); verificationSent = true; } catch { /* payment/access remains recoverable */ }
    await createSession(user.id);
    await db.auditLog.create({ data: { userId: user.id, action: "ACCOUNT_REGISTERED", metadata: { accountType: body.accountType, plan } } });
    return NextResponse.json({ id: user.id, verificationRequired: true, verificationSent, checkoutRequired: true, plan: plan.toLowerCase() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Ongeldige invoer" }, { status: 400 });
  }
}
