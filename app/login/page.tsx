"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell, AuthStatus } from "@/components/auth/AuthShell";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (r.ok) router.push(next as Route);
      else setError(await r.text());
    } catch {
      setError("Inloggen is tijdelijk niet beschikbaar. Probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell eyebrow="Veilige toegang" title="Welkom terug" description="Log in op je professionele Merelo-werkplek.">
      {error ? <AuthStatus tone="error">{error}</AuthStatus> : null}
      <form onSubmit={submit} className="auth-form" aria-busy={busy}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="email">E-mailadres</label>
          <input id="email" className="auth-input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="auth-field">
          <div className="auth-label-row">
            <label className="auth-label" htmlFor="password">Wachtwoord</label>
            <Link href="/wachtwoord-vergeten" className="auth-text-link">Wachtwoord vergeten?</Link>
          </div>
          <input id="password" className="auth-input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="auth-submit" disabled={busy} type="submit">{busy ? "Bezig met inloggen…" : "Inloggen"}<span aria-hidden="true">→</span></button>
      </form>
      <div className="auth-divider"><span>Nieuw bij Merelo?</span></div>
      <Link href="/register" className="auth-secondary-action">Account aanmaken</Link>
      <div className="auth-trust">Je gegevens worden verwerkt binnen je beveiligde werkplek.</div>
    </AuthShell>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<AuthShell eyebrow="Veilige toegang" title="Welkom terug" description="Log in op je professionele Merelo-werkplek."> <div aria-hidden="true" /></AuthShell>}>
      <LoginForm />
    </Suspense>
  );
}
