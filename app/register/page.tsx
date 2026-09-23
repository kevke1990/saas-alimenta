"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell, AuthStatus } from "@/components/auth/AuthShell";

const initialForm = { accountType:"BUSINESS", name:"", companyName:"", email:"", password:"", phone:"", addressLine1:"", postalCode:"", city:"", country:"Nederland", kvkNumber:"", vatNumber:"", website:"", practiceType:"" };

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const set = (key:string,value:string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(e:React.FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const r = await fetch("/api/auth/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
      const data = await r.json().catch(() => null);
      if (!r.ok) { setError(data?.error || "Registratie mislukt."); return; }
      if (data?.checkoutRequired) {
        const checkout=document.createElement("form"); checkout.method="POST"; checkout.action="/api/stripe/checkout";
        const plan=document.createElement("input"); plan.type="hidden"; plan.name="plan"; plan.value=data.plan; checkout.appendChild(plan);
        document.body.appendChild(checkout); checkout.submit(); return;
      }
      router.push("/verifieer-email");
    } catch { setError("Account aanmaken is tijdelijk niet beschikbaar. Probeer het opnieuw."); }
    finally { setBusy(false); }
  }

  const business = form.accountType === "BUSINESS";

  return (
    <AuthShell
      eyebrow="Nieuw account"
      title="Account aanmaken"
      description="Kies je accounttype en vul de gegevens in. Betaling volgt direct na registratie."
      asideTitle={business ? "Een professionele alimentatiepraktijk, één werkplek." : "Jouw alimentatiedossier, helder en professioneel onderbouwd."}
      asideDescription={business ? "Werk met cliënten, dossiers, berekeningen, onderbouwing en professionele rapportage in één omgeving." : "Maak een persoonlijk dossier voor kinder- en partneralimentatie en houd alle onderbouwing bij elkaar."}
      wide
    >
      {error ? <AuthStatus tone="error">{error}</AuthStatus> : null}
      <form onSubmit={submit} className="auth-form" aria-busy={busy}>
        <div className="auth-field auth-full">
          <span className="auth-label">Type account</span>
          <div className="auth-account-choice" role="group" aria-label="Type account">
            <button type="button" className={business ? "auth-choice auth-choice-active" : "auth-choice"} onClick={() => set("accountType","BUSINESS")} aria-pressed={business}>
              <strong>Zakelijk · €249/jaar</strong><small>5 actieve cliëntdossiers inbegrepen</small>
            </button>
            <button type="button" className={!business ? "auth-choice auth-choice-active" : "auth-choice"} onClick={() => set("accountType","PRIVATE")} aria-pressed={!business}>
              <strong>Particulier · €19,95/jaar</strong><small>1 persoonlijk dossier</small>
            </button>
          </div>
        </div>
        <div className="auth-form-grid">
          <div className="auth-field"><label className="auth-label" htmlFor="name">Naam *</label><input id="name" className="auth-input" required value={form.name} onChange={(e) => set("name",e.target.value)} /></div>
          <div className="auth-field"><label className="auth-label" htmlFor="email">E-mailadres *</label><input id="email" className="auth-input" type="email" autoComplete="email" required value={form.email} onChange={(e) => set("email",e.target.value)} /></div>
          <div className="auth-field"><label className="auth-label" htmlFor="phone">Telefoon</label><input id="phone" className="auth-input" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone",e.target.value)} /></div>
          <div className="auth-field"><label className="auth-label" htmlFor="password">Wachtwoord *</label><input id="password" className="auth-input" type="password" autoComplete="new-password" minLength={12} required value={form.password} onChange={(e) => set("password",e.target.value)} /><small className="auth-hint">Minimaal 12 tekens.</small></div>
          <div className="auth-section-title">Adres</div>
          <div className="auth-field auth-full"><label className="auth-label" htmlFor="addressLine1">Adres *</label><input id="addressLine1" className="auth-input" required value={form.addressLine1} onChange={(e) => set("addressLine1",e.target.value)} placeholder="Straat en huisnummer" /></div>
          <div className="auth-field"><label className="auth-label" htmlFor="postalCode">Postcode *</label><input id="postalCode" className="auth-input" required value={form.postalCode} onChange={(e) => set("postalCode",e.target.value)} /></div>
          <div className="auth-field"><label className="auth-label" htmlFor="city">Plaats *</label><input id="city" className="auth-input" required value={form.city} onChange={(e) => set("city",e.target.value)} /></div>
          {business ? <>
            <div className="auth-section-title">Praktijkgegevens</div>
            <div className="auth-field"><label className="auth-label" htmlFor="companyName">Kantoornaam *</label><input id="companyName" className="auth-input" required value={form.companyName} onChange={(e) => set("companyName",e.target.value)} /></div>
            <div className="auth-field"><label className="auth-label" htmlFor="kvkNumber">KvK-nummer *</label><input id="kvkNumber" className="auth-input" required value={form.kvkNumber} onChange={(e) => set("kvkNumber",e.target.value)} /></div>
            <div className="auth-field"><label className="auth-label" htmlFor="vatNumber">Btw-id</label><input id="vatNumber" className="auth-input" value={form.vatNumber} onChange={(e) => set("vatNumber",e.target.value)} /></div>
            <div className="auth-field"><label className="auth-label" htmlFor="website">Website</label><input id="website" className="auth-input" type="url" value={form.website} onChange={(e) => set("website",e.target.value)} /></div>
            <div className="auth-field"><label className="auth-label" htmlFor="practiceType">Praktijktype</label><select id="practiceType" className="auth-select" value={form.practiceType} onChange={(e) => set("practiceType",e.target.value)}><option value="">Kies...</option><option>Advocaat</option><option>Advocatenkantoor</option><option>Mediator</option><option>Financieel adviseur</option><option>Anders</option></select></div>
          </> : null}
        </div>
        <AuthStatus>Na het aanmaken word je direct naar de beveiligde betaalomgeving gestuurd. Zonder betaling wordt geen gratis abonnement geactiveerd.</AuthStatus>
        <button className="auth-submit" disabled={busy} type="submit">{busy ? "Registratie starten…" : "Doorgaan naar betaling →"}</button>
      </form>
      <p className="auth-footer-link">Heb je al een account? <Link href="/login" className="auth-text-link">Inloggen</Link></p>
    </AuthShell>
  );
}
