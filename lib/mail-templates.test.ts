import { describe, expect, it } from "vitest";
import { passwordResetEmailTemplate, verificationEmailTemplate } from "./mail-templates";

describe("authentication mail templates", () => {
  it("renders verification mail consistently", () => {
    const result = verificationEmailTemplate({ name: "Kevin", url: "https://example.test/verifieer-email?token=abc" });
    expect(result.subject).toBe("Bevestig je e-mailadres voor Alimenta Pro");
    expect(result.textBody).toContain("Hoi Kevin,");
    expect(result.textBody).toContain("https://example.test/verifieer-email?token=abc");
    expect(result.htmlBody).toContain("E-mailadres bevestigen");
  });

  it("renders password reset mail with the one-hour lifetime", () => {
    const result = passwordResetEmailTemplate({ url: "https://example.test/wachtwoord-reset?token=abc" });
    expect(result.subject).toBe("Wachtwoord resetten voor Alimenta Pro");
    expect(result.textBody).toContain("Deze link is 1 uur geldig.");
    expect(result.htmlBody).toContain("Wachtwoord resetten");
  });

  it("escapes user-controlled name and URL in HTML", () => {
    const result = verificationEmailTemplate({
      name: '<img src=x onerror="alert(1)">',
      url: 'https://example.test/?x=" onmouseover="alert(1)',
    });
    expect(result.htmlBody).not.toContain("<img");
    expect(result.htmlBody).not.toContain("onerror=");
    expect(result.htmlBody).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(result.htmlBody).toContain("&quot; onmouseover=&quot;");
  });

  it("uses a neutral greeting when no name is available", () => {
    const result = passwordResetEmailTemplate({ name: "   ", url: "https://example.test/reset" });
    expect(result.textBody.startsWith("Hoi,\n")).toBe(true);
    expect(result.htmlBody).toContain("<p>Hoi,</p>");
  });
});
