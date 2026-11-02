import { NextResponse } from "next/server";
import { distributedRateLimit, requestKey } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/auth-mail";

const GENERIC = "Als het account bestaat, is er een e-mail met instructies verzonden.";

export async function handlePasswordResetRequest(req: Request, jsonResponse = false) {
  const rl = await distributedRateLimit(requestKey(req, "password-reset"), 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return jsonResponse
      ? new NextResponse("Te veel verzoeken. Probeer later opnieuw.", { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
      : new NextResponse(GENERIC, { status: 202 });
  }
  try {
    const body = await req.json();
    const email = normalizeEmail(String(body?.email || ""));
    if (!email || email.length > 254 || !email.includes("@")) {
      return jsonResponse ? NextResponse.json({ ok: true }) : new NextResponse(GENERIC, { status: 202 });
    }
    const user = await db.user.findUnique({ where: { email } });
    if (user && !user.lockedAt) {
      try { await sendPasswordResetEmail(user); } catch { /* never disclose delivery state */ }
    }
    return jsonResponse ? NextResponse.json({ ok: true }) : new NextResponse(GENERIC, { status: 202 });
  } catch {
    return jsonResponse ? NextResponse.json({ ok: true }) : new NextResponse(GENERIC, { status: 202 });
  }
}

export async function POST(req: Request) {
  return handlePasswordResetRequest(req, false);
}

