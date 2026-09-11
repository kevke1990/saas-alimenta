import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMailIdentity, sendTransactionalEmail } from "@/lib/mail";

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map(v => v.trim()).filter(Boolean) : [];
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const draft = await db.mailMessage.findFirst({
      where: { id, userId: user.id, direction: "OUTBOUND", status: "DRAFT" },
    });
    if (!draft) return new NextResponse("Concept niet gevonden.", { status: 404 });

    const to = stringArray(draft.toEmails);
    const cc = stringArray(draft.ccEmails);
    const subject = draft.subject.trim();
    if (!to.length || !subject) return new NextResponse("Ontvanger en onderwerp zijn verplicht.", { status: 422 });

    const identity = await getMailIdentity(user.id);
    if (!identity) return new NextResponse("Geen geverifieerde afzender ingesteld.", { status: 409 });

    const result: any = await sendTransactionalEmail({
      from: `${identity.fromName} <${identity.fromEmail}>`,
      to,
      cc: cc.length ? cc : undefined,
      subject,
      textBody: draft.textBody || "",
      htmlBody: draft.htmlBody || undefined,
      replyTo: identity.replyTo || undefined,
      metadata: { alimentaUserId: user.id, clientId: draft.clientId || "", caseId: draft.caseId || "" },
    });
    const providerId = result?.MessageID || null;

    const sent = await db.mailMessage.update({
      where: { id: draft.id },
      data: { fromEmail: identity.fromEmail, providerId, status: "SENT" },
    });
    await db.mailLog.create({
      data: { userId: user.id, eventType: "SENT", toEmail: to.join(","), subject, status: "SENT", providerId },
    });
    await db.auditLog.create({
      data: { userId: user.id, action: "MAIL_DRAFT_SENT", metadata: { messageId: draft.id, providerId } },
    });
    return NextResponse.json({ ok: true, messageId: sent.id, providerId });
  } catch (e: any) {
    return new NextResponse(e?.message || "Concept verzenden mislukt.", { status: 400 });
  }
}
