import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptDocument, safeDocumentName } from "@/lib/document-store";
import { resolvePortalShare } from "@/lib/client-portal-share";

const SAFE_INLINE_MIMES = new Set(["application/pdf", "image/png", "image/jpeg"]);

export async function GET(_req: Request, { params }: { params: Promise<{ token: string; id: string }> }) {
  try {
    const { token, id } = await params;
    const share = await resolvePortalShare(token);
    const document = await db.document.findFirst({
      where: { id, caseId: share.caseId },
      select: { id: true, name: true, mimeType: true, sizeBytes: true, storageCipher: true },
    });

    if (!document) return new NextResponse("Document niet gevonden.", { status: 404 });

    const body = decryptDocument(document.storageCipher);
    await db.$executeRaw`
      INSERT INTO "AuditLog" ("id", "userId", "action", "metadata", "createdAt")
      VALUES (${crypto.randomUUID()}, ${share.userId}, ${"PORTAL_DOCUMENT_VIEWED"}, ${JSON.stringify({ shareId: share.shareId, documentId: document.id })}::jsonb, CURRENT_TIMESTAMP)
    `;

    const dispositionType = SAFE_INLINE_MIMES.has(document.mimeType) ? "inline" : "attachment";
    return new Response(body, {
      headers: {
        "content-type": SAFE_INLINE_MIMES.has(document.mimeType) ? document.mimeType : "application/octet-stream",
        "content-length": String(body.byteLength || document.sizeBytes),
        "content-disposition": `${dispositionType}; filename="${safeDocumentName(document.name)}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "content-security-policy": "sandbox; default-src 'none'",
      },
    });
  } catch {
    return new NextResponse("Ongeldige of verlopen cliëntportal-link.", { status: 401 });
  }
}
