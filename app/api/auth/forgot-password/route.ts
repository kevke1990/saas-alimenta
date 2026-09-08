import { NextResponse } from "next/server";
import { distributedRateLimit, requestKey } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/auth-mail";

const GENERIC = "Als het account bestaat, is er een e-mail met instructies verzonden.";

export async function POST(req: Request) {
  const rl = await distributedRateLimit(requestKey(req, "forgot-password"), 5, 15 * 60 * 1000);
  if (!rl.ok) return new NextResponse(GENERIC, { status: 202 });
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return new NextResponse(GENERIC, { status: 202 });
    const user = await db.user.findUnique({ where: { email } });
    if (user && !user.lockedAt) {
      try { await sendPasswordResetEmail(user); } catch { /* never disclose delivery state */ }
    }
    return new NextResponse(GENERIC, { status: 202 });
  } catch {
    return new NextResponse(GENERIC, { status: 202 });
  }
}
