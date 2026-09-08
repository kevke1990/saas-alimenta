function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function greeting(name?: string | null) {
  return name?.trim() ? `Hoi ${name.trim()},` : "Hoi,";
}

export function verificationEmailTemplate(input: { name?: string | null; url: string }) {
  const safeGreeting = escapeHtml(greeting(input.name));
  const safeUrl = escapeHtml(input.url);
  return {
    subject: "Bevestig je e-mailadres voor Alimenta Pro",
    textBody: `${greeting(input.name)}\n\nBevestig je e-mailadres via:\n${input.url}\n\nDeze link is 24 uur geldig. Heb je dit niet aangevraagd, dan kun je deze e-mail negeren.`,
    htmlBody: `<p>${safeGreeting}</p><p>Bevestig je e-mailadres voor Alimenta Pro.</p><p><a href="${safeUrl}">E-mailadres bevestigen</a></p><p>Deze link is 24 uur geldig.</p>`,
  };
}

export function passwordResetEmailTemplate(input: { name?: string | null; url: string }) {
  const safeGreeting = escapeHtml(greeting(input.name));
  const safeUrl = escapeHtml(input.url);
  return {
    subject: "Wachtwoord resetten voor Alimenta Pro",
    textBody: `${greeting(input.name)}\n\nReset je wachtwoord via:\n${input.url}\n\nDeze link is 1 uur geldig. Heb je dit niet aangevraagd, dan kun je deze e-mail negeren.`,
    htmlBody: `<p>${safeGreeting}</p><p>Je kunt je wachtwoord opnieuw instellen via de onderstaande link.</p><p><a href="${safeUrl}">Wachtwoord resetten</a></p><p>Deze link is 1 uur geldig.</p>`,
  };
}
