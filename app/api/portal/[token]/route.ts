import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolvePortalShare } from "@/lib/client-portal-share";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const share = await resolvePortalShare(token);
    const caseRow = await db.case.findUnique({
      where: { id: share.caseId },
      select: {
        id: true, name: true, status: true, reviewStatus: true, updatedAt: true,
        client: { select: { name: true } },
        calculations: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, engineVersion: true, normVersion: true, result: true, createdAt: true } },
        documents: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, name: true, category: true, mimeType: true, sizeBytes: true, createdAt: true } },
      },
    });
    if (!caseRow) return new NextResponse("Dossier niet gevonden.", { status: 404 });
    return NextResponse.json({ shareId: share.shareId, case: caseRow });
  } catch {
    return new NextResponse("Ongeldige of verlopen cliëntportal-link.", { status: 401 });
  }
}
