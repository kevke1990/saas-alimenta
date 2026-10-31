import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "ADMIN") {
      return new NextResponse("Toegang geweigerd: beheerder vereist", { status: 403 });
    }

    const body = await req.json();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || body.textBody || "").trim();
    const html = body.htmlBody ? String(body.htmlBody) : undefined;

    if (!subject || !message) {
      return new NextResponse("Onderwerp en bericht zijn verplicht.", { status: 422 });
    }

    // Haal alle actieve gebruikers op
    const users = await db.user.findMany({
      select: { id: true, email: true, name: true },
      where: { role: { not: "ANONYMOUS" as any } },
    });

    if (users.length === 0) {
      return NextResponse.json({ ok: true, recipientCount: 0, message: "Geen ontvangers gevonden." });
    }

    const fromEmail = process.env.MAIL_FROM || "Nieuwsbrief <noreply@merelo.nl>";
    let sentCount = 0;
    const failures: Array<{ email: string; error: string }> = [];

    // Verzend naar gebruikers
    for (const recipient of users) {
      try {
        await sendTransactionalEmail({
          from: fromEmail,
          to: [recipient.email],
          subject,
          textBody: `Beste ${recipient.name || "gebruiker"},\n\n${message}\n\n---\nJe ontvangt dit bericht als geregistreerde gebruiker.`,
          htmlBody: html
            ? `<p>Beste ${recipient.name || "gebruiker"},</p>${html}<hr><small>Je ontvangt dit bericht als geregistreerde gebruiker.</small>`
            : undefined,
          userId: user.id,
          eventType: "ADMIN_BROADCAST",
        });
        sentCount++;
      } catch (err: any) {
        failures.push({ email: recipient.email, error: err.message || "Verzendfout" });
      }
    }

    return NextResponse.json({
      ok: true,
      totalRecipients: users.length,
      sentCount,
      failedCount: failures.length,
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (e: any) {
    return new NextResponse(e?.message || "Broadcast mislukt", { status: 500 });
  }
}
