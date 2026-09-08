"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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
    e.preventDefault();
    setError("");
    if (!token) return setError("De resetlink ontbreekt.");
    if (password.length < 12) return setError("Gebruik minimaal 12 tekens.");
    if (password !== confirm) return setError("De wachtwoorden komen niet overeen.");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) throw new Error(await response.text());
      setDone(true);
      setTimeout(() => router.push("/login"), 1200);
    } catch (error: any) {
      setError(error?.message || "Resetten is mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-card-wrap" style={{ minHeight: "100vh" }}>
      <section className="auth-card">
        <h2>Nieuw wachtwoord</h2>
        {done ? (
          <>
            <div className="notice">Je wachtwoord is gewijzigd. Je wordt doorgestuurd naar de loginpagina.</div>
            <p className="topgap"><Link href="/login" style={{ color: "#315efb", fontWeight: 700 }}>Nu inloggen</Link></p>
          </>
        ) : (
          <>
            <p>Kies een nieuw wachtwoord van minimaal 12 tekens.</p>
            {error && <div className="notice error topgap">{error}</div>}
            <form onSubmit={submit} className="topgap">
              <div>
                <label className="label">Nieuw wachtwoord</label>
                <input className="input" type="password" required minLength={12} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="topgap">
                <label className="label">Herhaal wachtwoord</label>
                <input className="input" type="password" required minLength={12} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <button className="btn topgap" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>{busy ? "Opslaan…" : "Wachtwoord opslaan"}</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={<main className="auth-card-wrap" style={{ minHeight: "100vh" }}><section className="auth-card"><h2>Nieuw wachtwoord</h2><p>Resetpagina wordt geladen…</p></section></main>}>
      <PasswordResetContent />
    </Suspense>
  );
}
