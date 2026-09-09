"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (r.ok) router.push("/dashboard");
      else setError(await r.text());
    } catch {
      setError("Inloggen is tijdelijk niet beschikbaar. Probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page auth-page-premium">
      <section className="auth-side auth-side-premium">
        <div className="auth-brand">
          <div className="brand-mark brand-mark-light">A</div>
          <div><strong>Alimenta</strong><span>PRO</span></div>
        </div>
        <div className="auth-pitch">
          <div className="eyebrow eyebrow-light">Professionele alimentatiesoftware</div>
          <h1>Van dossier naar onderbouwd resultaat.</h1>
          <p>Een rustige, professionele werkplek voor cliënten, berekeningen, onderbouwing en rapportages.</p>
          <div className="auth-points"><span>✓ Transparante berekeningen</span><span>✓ Professionele rapportage</span><span>✓ Veilige dossieromgeving</span></div>
        </div>
        <small>Alimenta Pro · voor alimentatieprofessionals</small>
      </section>

      <section className="auth-card-wrap auth-card-wrap-premium">
        <div className="auth-card auth-card-premium">
          <div className="mobile-auth-brand"><div className="brand-mark">A</div><div><strong>Alimenta</strong><span>PRO</span></div></div>
          <div className="auth-kicker">Veilige toegang</div>
          <h2>Welkom terug</h2>
          <p>Log in op je professionele Alimenta Pro-werkplek.</p>
          {error && <div className="notice error topgap" role="alert">{error}</div>}
          <form onSubmit={submit} className="auth-form topgap">
            <div><label className="label" htmlFor="email">E-mailadres</label><input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><div className="label-row"><label className="label" htmlFor="password">Wachtwoord</label><Link href="/wachtwoord-vergeten">Vergeten?</Link></div><input id="password" className="input" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
            <button className="btn btn-premium" disabled={busy} type="submit">{busy ? "Bezig met inloggen…" : "Inloggen"}<span aria-hidden>→</span></button>
          </form>
          <div className="auth-divider"><span>Nieuw bij Alimenta Pro?</span></div>
          <Link href="/register" className="btn secondary auth-register">Account aanmaken</Link>
          <div className="auth-trust">Je gegevens worden verwerkt binnen je beveiligde werkplek.</div>
        </div>
      </section>
    </main>
  );
}
