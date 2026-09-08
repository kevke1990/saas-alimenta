import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeAuthToken, issueAuthToken } from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/auth-mail";
import { currentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return new NextResponse("Verificatielink ontbreekt", { status: 400 });
  const userId = await consumeAuthToken(token, "EMAIL_VERIFY");
  if (!userId) return new NextResponse("Verificatielink is ongeldig of verlopen", { status: 400 });
  await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return NextResponse.json({ ok: true, verified: true });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("Niet ingelogd", { status: 401 });
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });
  try {
    await sendVerificationEmail(user);
    return NextResponse.json({ ok: true, sent: true });
  } catch (error: any) {
    return new NextResponse(error?.message || "E-mail kon niet worden verzonden", { status: 503 });
  }
}
