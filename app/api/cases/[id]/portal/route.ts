import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { requireCaseTenantAccess } from "@/lib/tenant-access";
import { db } from "@/lib/db";
import { createPortalShare, revokePortalShare } from "@/lib/client-portal-share";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireCaseTenantAccess(user.id, id, "PROFESSIONAL");
    const body = await req.json().catch(() => ({}));
    const hours = Number(body?.expiresInHours ?? 168);
    const share = await createPortalShare(id, user.id, Number.isFinite(hours) ? hours : 168);
    await db.auditLog.create({ data: { userId: user.id, action: "CLIENT_PORTAL_SHARE_CREATED", metadata: { caseId: id, shareId: share.id, expiresAt: share.expiresAt } } });
    return NextResponse.json({ ...share, inviteUrl: `${process.env.APP_URL || ""}/portal/${share.token}` }, { status: 201 });
  } catch (e: any) {
    return new NextResponse(e?.message || "Cliëntportal-link maken mislukt.", { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireCaseTenantAccess(user.id, id, "PROFESSIONAL");
    const body = await req.json();
    const shareId = typeof body?.shareId === "string" ? body.shareId : "";
    if (!shareId) return new NextResponse("shareId ontbreekt.", { status: 400 });
    const revoked = await revokePortalShare(shareId, id, user.id);
    if (!revoked) return new NextResponse("Portal-link niet gevonden of al ingetrokken.", { status: 404 });
    await db.auditLog.create({ data: { userId: user.id, action: "CLIENT_PORTAL_SHARE_REVOKED", metadata: { caseId: id, shareId } } });
    return NextResponse.json({ ok: true, shareId });
  } catch (e: any) {
    return new NextResponse(e?.message || "Cliëntportal-link intrekken mislukt.", { status: 400 });
  }
}
