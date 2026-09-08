"use client";
import { useState } from "react";
import Link from "next/link";

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
    } catch (e: any) { setError(e?.message || "Probeer het later opnieuw."); }
    finally { setBusy(false); }
  }

  return <main className="auth-card-wrap" style={{ minHeight: "100vh" }}><section className="auth-card">
    <h2>Wachtwoord vergeten?</h2>
    {sent ? <><div className="notice topgap">Als het account bestaat, is er een e-mail met instructies verzonden.</div><p className="topgap"><Link href="/login" style={{color:"#315efb",fontWeight:700}}>Terug naar inloggen</Link></p></> : <>
      <p>Vul je e-mailadres in. We sturen een beveiligde link als er een account bestaat.</p>
      {error && <div className="notice error topgap">{error}</div>}
      <form onSubmit={submit} className="topgap"><label className="label">E-mailadres</label><input className="input" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/><button className="btn topgap" disabled={busy} style={{width:"100%",justifyContent:"center"}}>{busy?"Versturen…":"Resetlink versturen"}</button></form>
      <p className="topgap"><Link href="/login" style={{color:"#315efb",fontWeight:700}}>Terug naar inloggen</Link></p>
    </>}
  </section></main>;
}
