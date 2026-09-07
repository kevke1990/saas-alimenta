import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditSecurity } from "@/lib/team-security";

export async function GET() {
  try {
    const user = await requireUser();
    const events = await db.auditLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, action: true, metadata: true, createdAt: true } });
    return NextResponse.json({ events });
  } catch (e: any) { return new NextResponse(e?.message || "Security events ophalen mislukt.", { status: 400 }); }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const action = String(body?.action || "SECURITY_EVENT").slice(0, 80);
    const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : {};
    await auditSecurity(user.id, action, metadata);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return new NextResponse(e?.message || "Security event opslaan mislukt.", { status: 400 }); }
}
