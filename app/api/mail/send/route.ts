import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMailIdentity, sendTransactionalEmail } from "@/lib/mail";
import { decryptDocument } from "@/lib/document-store";
import { requireCaseTenantAccess, requireClientTenantAccess } from "@/lib/tenant-access";
import { distributedRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const rate = await distributedRateLimit(`mail:send:${u.id}`, 30, 15 * 60 * 1000);
    if (!rate.ok) {
      return new NextResponse("Te veel e-mails verzonden. Probeer het later opnieuw.", {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      });
    }
    const body: any = await req.json();
    const to = Array.isArray(body.to) ? body.to.map(String) : [String(body.to || "")];
    if (!to[0] || !body.subject) return new NextResponse("Ontvanger en onderwerp zijn verplicht", { status: 422 });

    const clientId = body.clientId ? String(body.clientId) : null;
    const caseId = body.caseId ? String(body.caseId) : null;
    if (clientId) {
      await requireClientTenantAccess(u.id, clientId, "PROFESSIONAL");
    }
    if (caseId) {
      await requireCaseTenantAccess(u.id, caseId, "PROFESSIONAL");
    }

    const identity = await getMailIdentity(u.id);
    if (!identity) return new NextResponse("Geen geverifieerde afzender ingesteld", { status: 409 });

    const docIds = Array.isArray(body.documentIds) ? body.documentIds.map(String).slice(0, 10) : [];
    const docs = docIds.length
      ? await db.document.findMany({
          where: {
            id: { in: docIds },
            ...(caseId ? { caseId } : { userId: u.id }),
          },
        })
      : [];
    const attachments = docs.map((d) => ({
      Name: d.name,
      Content: decryptDocument(d.storageCipher).toString("base64"),
      ContentType: d.mimeType,
    }));

    const result: any = await sendTransactionalEmail({
      from: `${identity.fromName} <${identity.fromEmail}>`,
      to,
      cc: Array.isArray(body.cc) ? body.cc.map(String) : undefined,
      subject: String(body.subject),
      textBody: String(body.textBody || ""),
      htmlBody: body.htmlBody ? String(body.htmlBody) : undefined,
      replyTo: identity.replyTo || undefined,
      attachments,
      metadata: { alimentaUserId: u.id, clientId: clientId || "" },
    });
    await db.mailMessage.create({
      data: {
        userId: u.id,
        clientId,
        caseId,
        direction: "OUTBOUND",
        fromEmail: identity.fromEmail,
        toEmails: to,
        ccEmails: body.cc || [],
        subject: String(body.subject),
        textBody: String(body.textBody || ""),
        htmlBody: body.htmlBody ? String(body.htmlBody) : null,
        providerId: result?.MessageID || null,
        status: "SENT",
      },
    });
    await db.mailLog.create({
      data: {
        userId: u.id,
        eventType: "SENT",
        toEmail: to.join(","),
        subject: String(body.subject),
        status: "SENT",
        providerId: result?.MessageID || null,
      },
    });
    return NextResponse.json({ ok: true, messageId: result?.MessageID || null });
  } catch (e: any) {
    return new NextResponse(e?.message || "Mail verzenden mislukt", {
      status: e?.message === "UNAUTHORIZED" ? 401 : e?.status === 403 ? 403 : 400,
    });
  }
}
