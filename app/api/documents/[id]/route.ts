import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptDocument, safeDocumentName } from "@/lib/document-store";
import { requireCaseTenantAccess, requireClientTenantAccess } from "@/lib/tenant-access";

const SAFE_INLINE_MIMES = new Set(["application/pdf", "image/png", "image/jpeg"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const d = await db.document.findFirst({ where: { id } });
    if (!d) return new NextResponse("Document niet gevonden", { status: 404 });

    if (d.caseId) {
      await requireCaseTenantAccess(u.id, d.caseId, "READ_ONLY");
    } else if (d.clientId) {
      await requireClientTenantAccess(u.id, d.clientId, "READ_ONLY");
    } else if (d.userId !== u.id) {
      return new NextResponse("Geen toegang tot document", { status: 403 });
    }

    const dispositionType = SAFE_INLINE_MIMES.has(d.mimeType) ? "inline" : "attachment";
    return new Response(decryptDocument(d.storageCipher), {
      headers: {
        "content-type": SAFE_INLINE_MIMES.has(d.mimeType) ? d.mimeType : "application/octet-stream",
        "content-disposition": `${dispositionType}; filename="${safeDocumentName(d.name)}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "content-security-policy": "sandbox; default-src 'none'",
      },
    });
  } catch (e: any) {
    return new NextResponse(e?.message || "Document mislukt", {
      status: e?.message === "UNAUTHORIZED" ? 401 : e?.status === 403 ? 403 : 400,
    });
  }
}
