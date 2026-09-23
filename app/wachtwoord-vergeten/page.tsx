"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell, AuthStatus } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      if (!r.ok) throw new Error("Aanvraag kon niet worden verwerkt.");
      setSent(true);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Probeer het later opnieuw.");
    } finally { setBusy(false); }
  }

  return (
    <AuthShell eyebrow="Account herstellen" title="Wachtwoord vergeten?" description="Vul je e-mailadres in. We sturen een beveiligde link als er een account bestaat.">
      {sent ? <>
        <AuthStatus>Als het account bestaat, is er een e-mail met instructies verzonden.</AuthStatus>
        <Link href="/login" className="auth-secondary-action">Terug naar inloggen</Link>
      </> : <>
        {error ? <AuthStatus tone="error">{error}</AuthStatus> : null}
        <form onSubmit={submit} className="auth-form" aria-busy={busy}>
          <div className="auth-field"><label className="auth-label" htmlFor="email">E-mailadres</label><input id="email" className="auth-input" type="email" required autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <button className="auth-submit" disabled={busy} type="submit">{busy ? "Versturen…" : "Resetlink versturen"}</button>
        </form>
        <p className="auth-footer-link"><Link href="/login" className="auth-text-link">Terug naar inloggen</Link></p>
      </>}
    </AuthShell>
  );
}
