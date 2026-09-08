import { db } from "./db";

type TransactionalEmailInput = {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  replyTo?: string;
  attachments?: { Name: string; Content: string; ContentType: string; ContentID?: string }[];
  metadata?: Record<string, string>;
  userId?: string;
  eventType?: string;
};

async function logMail(input: TransactionalEmailInput, status: "SENT" | "FAILED", providerId?: string, error?: string) {
  if (!input.userId) return;
  try {
    await db.mailLog.create({
      data: {
        userId: input.userId,
        eventType: input.eventType || "TRANSACTIONAL",
        toEmail: input.to.join(","),
        subject: input.subject,
        status,
        providerId,
        error: error ? error.slice(0, 2000) : undefined,
      },
    });
  } catch {
    // Mail logging must never turn a successfully handled mail request into a failure.
  }
}

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) {
    const error = "POSTMARK_SERVER_TOKEN ontbreekt";
    await logMail(input, "FAILED", undefined, error);
    throw new Error(error);
  }

  const body: Record<string, unknown> = {
    From: input.from,
    To: input.to.join(","),
    Subject: input.subject,
    TextBody: input.textBody || "",
    HtmlBody: input.htmlBody || undefined,
    ReplyTo: input.replyTo || undefined,
    MessageStream: process.env.POSTMARK_OUTBOUND_STREAM || "outbound",
    Attachments: input.attachments || undefined,
    Metadata: input.metadata || undefined,
  };

  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify(body),
    });
    const result: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = result?.Message || `Postmark fout (${response.status})`;
      await logMail(input, "FAILED", result?.MessageID, error);
      throw new Error(error);
    }

    await logMail(input, "SENT", result?.MessageID);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Onbekende mailfout";
    if (!message.startsWith("Postmark fout") && !(error instanceof Error && message === "Postmark fout")) {
      await logMail(input, "FAILED", undefined, message);
    }
    throw error;
  }
}

export async function getMailIdentity(userId: string) {
  return db.mailIdentity.findFirst({
    where: { userId, status: "VERIFIED" },
    orderBy: { createdAt: "asc" },
  });
}
