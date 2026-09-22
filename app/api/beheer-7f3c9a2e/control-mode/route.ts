import { NextResponse } from "next/server";
import { requireAdmin, setSessionControlModeCookie } from "@/lib/auth";
import { CONTROL_MODES, getSessionContext, normalizeControlMode } from "@/lib/control-mode";
import { db } from "@/lib/db";
import { auditSecurity } from "@/lib/team-security";
import { requireSameOrigin } from "@/lib/request-security";

export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    const admin = await requireAdmin();
    const body = await req.json();
    const mode = normalizeControlMode(body?.mode);
    if (!CONTROL_MODES.includes(mode)) {
      return new NextResponse("Ongeldige control mode.", { status: 422 });
    }

    const context = await getSessionContext();
    if (!context.sessionHash) return new NextResponse("Sessie ontbreekt.", { status: 401 });

    const result = await db.authSession.updateMany({
      where: {
        tokenHash: context.sessionHash,
        userId: admin.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { controlMode: mode },
    });

    if (result.count !== 1) return new NextResponse("Actieve sessie niet gevonden.", { status: 401 });

    await setSessionControlModeCookie(mode);
    await auditSecurity(admin.id, "CONTROL_MODE_CHANGED", { mode });
    return NextResponse.json({ ok: true, controlMode: mode });
  } catch (error: any) {
    if (error?.message === "CROSS_ORIGIN_REQUEST") {
      return new NextResponse("Ongeldige herkomst van verzoek.", { status: 403 });
    }
    if (error?.message === "UNAUTHORIZED") {
      return new NextResponse("Niet ingelogd.", { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return new NextResponse("Geen beheerdersrechten.", { status: 403 });
    }
    return new NextResponse(error?.message || "Control mode wijzigen mislukt.", { status: 400 });
  }
}
