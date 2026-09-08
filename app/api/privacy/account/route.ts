import { NextResponse } from "next/server";
import { requireUser, verifyPassword, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildAccountExport, eraseAccountData, PRIVACY_POLICY_VERSION } from "@/lib/privacy";
import { requireSameOrigin } from "@/lib/request-security";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await buildAccountExport(user.id);
    if (!data) return new NextResponse("Account niet gevonden", { status: 404 });
    return NextResponse.json({ ...data, privacyPolicyVersion: PRIVACY_POLICY_VERSION }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return new NextResponse(e?.message || "Account-export mislukt", { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    requireSameOrigin(req);
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== "DELETE") return new NextResponse("Bevestiging ontbreekt", { status: 422 });
    if (!body?.password || !(await verifyPassword(String(body.password), user.passwordHash))) return new NextResponse("Wachtwoord ongeldig", { status: 401 });
    if (user.isAdmin || user.role === "ADMIN") return new NextResponse("Het hoofdbeheeraccount kan niet via self-service worden verwijderd", { status: 403 });
    await db.privacyRequest.create({ data: { userId: user.id, type: "ERASURE", status: "COMPLETED", verifiedAt: new Date(), completedAt: new Date(), notes: "Accountverwijdering door gebruiker na wachtwoordbevestiging." } });
    const result = await eraseAccountData(user.id);
    await destroySession();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return new NextResponse(e?.message || "Account verwijderen mislukt", { status: 400 });
  }
}
