import { issueAuthToken } from "@/lib/auth-tokens";
import { sendTransactionalEmail } from "@/lib/mail";
import { passwordResetEmailTemplate, verificationEmailTemplate } from "@/lib/mail-templates";

function appUrl() {
  const value = process.env.APP_URL;
  if (!value || (!value.startsWith("https://") && !(process.env.NODE_ENV !== "production" && value.startsWith("http://")))) {
    throw new Error("APP_URL moet HTTPS zijn in productie");
  }
  return value.replace(/\/$/, "");
}

function systemFrom() {
  const value = process.env.MAIL_FROM;
  if (!value) throw new Error("MAIL_FROM ontbreekt");
  return value;
}

export async function sendVerificationEmail(user: { id: string; email: string; name?: string | null }) {
  const token = await issueAuthToken(user.id, "EMAIL_VERIFY", 24 * 60 * 60 * 1000);
  const url = `${appUrl()}/verifieer-email?token=${encodeURIComponent(token)}`;
  const template = verificationEmailTemplate({ name: user.name, url });
  await sendTransactionalEmail({
    userId: user.id,
    eventType: "EMAIL_VERIFICATION",
    from: systemFrom(),
    to: [user.email],
    subject: template.subject,
    textBody: template.textBody,
    htmlBody: template.htmlBody,
  });
}

export async function sendPasswordResetEmail(user: { id: string; email: string; name?: string | null }) {
  const token = await issueAuthToken(user.id, "PASSWORD_RESET", 60 * 60 * 1000);
  const url = `${appUrl()}/wachtwoord-reset?token=${encodeURIComponent(token)}`;
  const template = passwordResetEmailTemplate({ name: user.name, url });
  await sendTransactionalEmail({
    userId: user.id,
    eventType: "PASSWORD_RESET",
    from: systemFrom(),
    to: [user.email],
    subject: template.subject,
    textBody: template.textBody,
    htmlBody: template.htmlBody,
  });
}
