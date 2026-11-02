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

const FORBIDDEN_CLIENT_ACTION_PREFIXES = [
  "CASE_",
  "USER_",
  "ORG_",
  "ADMIN_",
  "AUTH_",
  "DOCUMENT_",
  "INCOME_",
  "SCENARIO_",
  "BILLING_",
  "STRIPE_",
  "MOLLIE_",
  "PORTAL_",
  "API_",
];

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const rawAction = String(body?.action || "SECURITY_EVENT").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 64);
    if (FORBIDDEN_CLIENT_ACTION_PREFIXES.some((prefix) => rawAction.startsWith(prefix))) {
      return new NextResponse("Interne systeem-auditacties mogen niet door de client worden geregistreerd.", { status: 403 });
    }
    const action = rawAction.startsWith("CLIENT_") ? rawAction : `CLIENT_${rawAction || "SECURITY_EVENT"}`;
    const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : {};
    await auditSecurity(user.id, action, metadata);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return new NextResponse(e?.message || "Security event opslaan mislukt.", { status: e?.message === "UNAUTHORIZED" ? 401 : 400 }); }
}
