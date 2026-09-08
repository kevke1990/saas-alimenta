"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const params = useSearchParams(); const [state, setState] = useState<"loading"|"ok"|"error">("loading"); const [message, setMessage] = useState("");
  useEffect(() => { const token = params.get("token"); if (!token) { setState("error"); setMessage("De verificatielink ontbreekt."); return; } fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`).then(async r => { if (!r.ok) throw new Error(await r.text()); setState("ok"); }).catch(e => { setState("error"); setMessage(e?.message || "De verificatielink is ongeldig of verlopen."); }); }, [params]);
  return <main className="auth-card-wrap" style={{ minHeight: "100vh" }}><section className="auth-card"><h2>E-mailadres bevestigen</h2>{state === "loading" && <p>Je e-mailadres wordt gecontroleerd…</p>}{state === "ok" && <><div className="notice">Je e-mailadres is bevestigd. Je kunt nu verder met Alimenta Pro.</div><p className="topgap"><Link href="/dashboard" style={{color:"#315efb",fontWeight:700}}>Naar je werkplek</Link></p></>}{state === "error" && <><div className="notice error">{message}</div><p className="topgap">Log opnieuw in en vraag eventueel een nieuwe verificatiemail aan.</p><p className="topgap"><Link href="/login" style={{color:"#315efb",fontWeight:700}}>Terug naar inloggen</Link></p></>}</section></main>;
}
