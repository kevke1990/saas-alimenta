import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = String(body?.token || "");
    const password = String(body?.password || "");
    if (!token || password.length < 12) return new NextResponse("Ongeldige of te zwakke invoer", { status: 400 });
    const userId = await consumeAuthToken(token, "PASSWORD_RESET");
    if (!userId) return new NextResponse("Resetlink is ongeldig of verlopen", { status: 400 });
    const passwordHash = await hashPassword(password);
    await db.user.update({ where: { id: userId }, data: { passwordHash } });
    return NextResponse.json({ ok: true });
  } catch {
    return new NextResponse("Ongeldige invoer", { status: 400 });
  }
}
