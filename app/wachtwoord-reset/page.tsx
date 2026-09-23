"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthShell, AuthStatus } from "@/components/auth/AuthShell";

function PasswordResetContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const token = params.get("token") || "";

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!token) return setError("De resetlink ontbreekt.");
    if (password.length < 12) return setError("Gebruik minimaal 12 tekens.");
    if (password !== confirm) return setError("De wachtwoorden komen niet overeen.");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }) });
      if (!response.ok) throw new Error(await response.text());
      setDone(true);
      setTimeout(() => router.push("/login"), 1200);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Resetten is mislukt.");
    } finally { setBusy(false); }
  }

  return (
    <AuthShell eyebrow="Account herstellen" title="Nieuw wachtwoord" description="Kies een nieuw wachtwoord van minimaal 12 tekens.">
      {done ? <>
        <AuthStatus tone="success">Je wachtwoord is gewijzigd. Je wordt doorgestuurd naar de loginpagina.</AuthStatus>
        <Link href="/login" className="auth-secondary-action">Nu inloggen</Link>
      </> : <>
        {error ? <AuthStatus tone="error">{error}</AuthStatus> : null}
        <form onSubmit={submit} className="auth-form" aria-busy={busy}>
          <div className="auth-field"><label className="auth-label" htmlFor="password">Nieuw wachtwoord</label><input id="password" className="auth-input" type="password" required minLength={12} autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} /><small className="auth-hint">Minimaal 12 tekens.</small></div>
          <div className="auth-field"><label className="auth-label" htmlFor="confirm">Herhaal wachtwoord</label><input id="confirm" className="auth-input" type="password" required minLength={12} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          <button className="auth-submit" disabled={busy} type="submit">{busy ? "Opslaan…" : "Wachtwoord opslaan"}</button>
        </form>
      </>}
    </AuthShell>
  );
}

function PasswordResetFallback() {
  return <AuthShell eyebrow="Account herstellen" title="Nieuw wachtwoord" description="De beveiligde resetlink wordt gecontroleerd."><AuthStatus>Resetpagina wordt geladen…</AuthStatus></AuthShell>;
}

export default function PasswordResetPage() {
  return <Suspense fallback={<PasswordResetFallback />}><PasswordResetContent /></Suspense>;
}
