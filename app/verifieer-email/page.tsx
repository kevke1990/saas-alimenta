"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const params = useSearchParams();
  const [state, setState] = useState<"loading" | "waiting" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState("waiting");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        setState("ok");
      })
      .catch((error) => {
        setState("error");
        setMessage(error?.message || "De verificatielink is ongeldig of verlopen.");
      });
  }, [params]);

  async function resend() {
    setResending(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/verify-email", { method: "POST" });
      if (!response.ok) throw new Error(await response.text());
      setMessage("Een nieuwe verificatiemail is verzonden.");
    } catch (error: any) {
      setMessage(error?.message || "De verificatiemail kon niet worden verzonden.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth-card-wrap" style={{ minHeight: "100vh" }}>
      <section className="auth-card">
        <h2>E-mailadres bevestigen</h2>
        {state === "loading" && <p>Je e-mailadres wordt gecontroleerd…</p>}
        {state === "waiting" && (
          <>
            <div className="notice">Je account is aangemaakt. Controleer je inbox en klik op de verificatielink om je e-mailadres te bevestigen.</div>
            <p className="topgap">Geen mail ontvangen? Controleer ook je spamfolder of vraag hieronder een nieuwe mail aan.</p>
            {message && <div className="notice topgap">{message}</div>}
            <button className="btn topgap" onClick={resend} disabled={resending}>{resending ? "Verzenden…" : "Verificatiemail opnieuw sturen"}</button>
            <p className="topgap"><Link href="/dashboard" style={{ color: "#315efb", fontWeight: 700 }}>Verder naar je werkplek</Link></p>
          </>
        )}
        {state === "ok" && (
          <>
            <div className="notice">Je e-mailadres is bevestigd. Je kunt nu verder met Alimenta Pro.</div>
            <p className="topgap"><Link href="/dashboard" style={{ color: "#315efb", fontWeight: 700 }}>Naar je werkplek</Link></p>
          </>
        )}
        {state === "error" && (
          <>
            <div className="notice error">{message}</div>
            <p className="topgap">Log opnieuw in en vraag eventueel een nieuwe verificatiemail aan.</p>
            <p className="topgap"><Link href="/login" style={{ color: "#315efb", fontWeight: 700 }}>Terug naar inloggen</Link></p>
          </>
        )}
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="auth-card-wrap" style={{ minHeight: "100vh" }}><section className="auth-card"><h2>E-mailadres bevestigen</h2><p>Je e-mailadres wordt gecontroleerd…</p></section></main>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
