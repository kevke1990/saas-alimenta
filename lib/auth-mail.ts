import { issueAuthToken } from "@/lib/auth-tokens";
import { sendTransactionalEmail } from "@/lib/mail";

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
  const greeting = user.name ? `Hoi ${user.name},` : "Hoi,";
  await sendTransactionalEmail({
    userId: user.id,
    eventType: "EMAIL_VERIFICATION",
    from: systemFrom(),
    to: [user.email],
    subject: "Bevestig je e-mailadres voor Alimenta Pro",
    textBody: `${greeting}\n\nBevestig je e-mailadres via:\n${url}\n\nDeze link is 24 uur geldig. Heb je dit niet aangevraagd, dan kun je deze e-mail negeren.`,
    htmlBody: `<p>${greeting}</p><p>Bevestig je e-mailadres voor Alimenta Pro.</p><p><a href="${url}">E-mailadres bevestigen</a></p><p>Deze link is 24 uur geldig.</p>`,
  });
}

export async function sendPasswordResetEmail(user: { id: string; email: string; name?: string | null }) {
  const token = await issueAuthToken(user.id, "PASSWORD_RESET", 60 * 60 * 1000);
  const url = `${appUrl()}/wachtwoord-reset?token=${encodeURIComponent(token)}`;
  const greeting = user.name ? `Hoi ${user.name},` : "Hoi,";
  await sendTransactionalEmail({
    userId: user.id,
    eventType: "PASSWORD_RESET",
    from: systemFrom(),
    to: [user.email],
    subject: "Wachtwoord resetten voor Alimenta Pro",
    textBody: `${greeting}\n\nReset je wachtwoord via:\n${url}\n\nDeze link is 1 uur geldig. Heb je dit niet aangevraagd, dan kun je deze e-mail negeren.`,
    htmlBody: `<p>${greeting}</p><p>Je kunt je wachtwoord opnieuw instellen via de onderstaande link.</p><p><a href="${url}">Wachtwoord resetten</a></p><p>Deze link is 1 uur geldig.</p>`,
  });
}
