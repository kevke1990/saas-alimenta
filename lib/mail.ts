import { db } from "./db";
import nodemailer, { type Transporter, type SendMailOptions } from "nodemailer";

type TransactionalEmailInput = {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
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
    // Mail logging must never turn a mail request into a failure.
  }
}

let smtpTransporter: Transporter | null = null;

function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;
  const host = process.env.SMTP_HOST || "127.0.0.1";
  const port = Number(process.env.SMTP_PORT || 25);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: process.env.SMTP_IGNORE_TLS !== "true" && process.env.NODE_ENV === "production" ? false : false,
    },
  });

  return smtpTransporter;
}

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const mailProvider = (process.env.MAIL_PROVIDER || "smtp").toLowerCase();

  // 1. SMTP Provider (Standaard & Universeel inzetbaar)
  if (mailProvider === "smtp" || !process.env.POSTMARK_SERVER_TOKEN) {
    try {
      const transporter = getSmtpTransporter();
      const mailOptions: SendMailOptions = {
        from: input.from,
        to: input.to,
        cc: input.cc,
        bcc: input.bcc,
        subject: input.subject,
        text: input.textBody || "",
        html: input.htmlBody,
        replyTo: input.replyTo,
        attachments: input.attachments?.map((a) => ({
          filename: a.Name,
          content: Buffer.from(a.Content, "base64"),
          contentType: a.ContentType,
          cid: a.ContentID,
        })),
      };

      const info = await transporter.sendMail(mailOptions);
      await logMail(input, "SENT", info.messageId);
      return { MessageID: info.messageId, SubmittedAt: new Date().toISOString() };
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "SMTP verzendfout";
      await logMail(input, "FAILED", undefined, message);
      throw new Error(`Email verzenden via SMTP mislukt: ${message}`);
    }
  }

  // 2. Postmark Provider (indien POSTMARK_SERVER_TOKEN geconfigureerd is)
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const body: Record<string, unknown> = {
    From: input.from,
    To: input.to.join(","),
    Cc: input.cc?.join(",") || undefined,
    Bcc: input.bcc?.join(",") || undefined,
    Subject: input.subject,
    TextBody: input.textBody || "",
    HtmlBody: input.htmlBody || undefined,
    ReplyTo: input.replyTo || undefined,
    MessageStream: process.env.POSTMARK_OUTBOUND_STREAM || "outbound",
    Attachments: input.attachments || undefined,
    Metadata: input.metadata || undefined,
  };

  let failureLogged = false;
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
      const message = result?.Message || `Postmark fout (${response.status})`;
      failureLogged = true;
      await logMail(input, "FAILED", result?.MessageID, message);
      throw new Error(message);
    }

    await logMail(input, "SENT", result?.MessageID);
    return result;
  } catch (error) {
    if (!failureLogged) {
      const message = error instanceof Error ? error.message : "Onbekende mailfout";
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
