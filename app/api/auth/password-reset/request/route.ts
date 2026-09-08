import { NextResponse } from "next/server";
import { distributedRateLimit, requestKey } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/auth-mail";

export async function POST(req: Request) {
  const rl = await distributedRateLimit(requestKey(req, "password-reset"), 5, 60 * 60 * 1000);
  if (!rl.ok) return new NextResponse("Te veel verzoeken. Probeer later opnieuw.", { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    if (email.length > 254 || !email.includes("@")) return NextResponse.json({ ok: true });
    const user = await db.user.findUnique({ where: { email } });
    if (user && !user.lockedAt) {
      try { await sendPasswordResetEmail(user); } catch { /* Never reveal account or provider state. */ }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
