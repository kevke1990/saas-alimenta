"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell, AuthStatus } from "@/components/auth/AuthShell";

function VerifyEmailContent() {
  const params = useSearchParams();
  const [state, setState] = useState<"loading" | "waiting" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setState("waiting"); return; }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => { if (!response.ok) throw new Error(await response.text()); setState("ok"); })
      .catch((caught: unknown) => { setState("error"); setMessage(caught instanceof Error ? caught.message : "De verificatielink is ongeldig of verlopen."); });
  }, [params]);

  async function resend() {
    setResending(true); setMessage("");
    try {
      const response = await fetch("/api/auth/verify-email", { method: "POST" });
      if (!response.ok) throw new Error(await response.text());
      setMessage("Een nieuwe verificatiemail is verzonden.");
    } catch (caught: unknown) {
      setMessage(caught instanceof Error ? caught.message : "De verificatiemail kon niet worden verzonden.");
    } finally { setResending(false); }
  }

  return (
    <AuthShell eyebrow="Accountbeveiliging" title="E-mailadres bevestigen" description="Bevestig je e-mailadres om je account volledig te activeren.">
      {state === "loading" ? <AuthStatus>Je e-mailadres wordt gecontroleerd…</AuthStatus> : null}
      {state === "waiting" ? <>
        <AuthStatus>Je account is aangemaakt. Controleer je inbox en klik op de verificatielink.</AuthStatus>
        <p className="auth-plan-note">Geen mail ontvangen? Controleer ook je spamfolder of vraag hieronder een nieuwe mail aan.</p>
        {message ? <AuthStatus tone="success">{message}</AuthStatus> : null}
        <button className="auth-submit" onClick={resend} disabled={resending} type="button">{resending ? "Verzenden…" : "Verificatiemail opnieuw sturen"}</button>
        <p className="auth-footer-link"><Link className="auth-text-link" href="/dashboard">Verder naar je werkplek</Link></p>
      </> : null}
      {state === "ok" ? <>
        <AuthStatus tone="success">Je e-mailadres is bevestigd. Je kunt nu verder met Alimenta Pro.</AuthStatus>
        <Link href="/dashboard" className="auth-submit">Naar je werkplek</Link>
      </> : null}
      {state === "error" ? <>
        <AuthStatus tone="error">{message}</AuthStatus>
        <p className="auth-plan-note">Log opnieuw in en vraag eventueel een nieuwe verificatiemail aan.</p>
        <Link href="/login" className="auth-secondary-action">Terug naar inloggen</Link>
      </> : null}
    </AuthShell>
  );
}

function VerifyEmailFallback() {
  return <AuthShell eyebrow="Accountbeveiliging" title="E-mailadres bevestigen" description="De verificatielink wordt gecontroleerd."><AuthStatus>Je e-mailadres wordt gecontroleerd…</AuthStatus></AuthShell>;
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<VerifyEmailFallback />}><VerifyEmailContent /></Suspense>;
}
