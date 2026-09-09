"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditClientForm() {
  const { id } = useParams<{ id: string }>();
  const r = useRouter();
  const [f, setF] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch(`/api/clients/${id}`).then(x => x.ok ? x.json() : null).then(setF).catch(() => setErr("Cliënt laden mislukt.")); }, [id]);
  if (!f) return <div style={{ maxWidth: 980 }}><div className="panel">{err || "Cliënt laden…"}</div></div>;
  const set = (k: string, v: string) => setF((x: any) => ({ ...x, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      if (res.ok) r.push(`/clients/${id}`); else setErr(await res.text());
    } catch { setErr("Opslaan mislukt. Probeer het opnieuw."); }
    finally { setBusy(false); }
  }

  return <div style={{ maxWidth: 980 }}>
    <div className="page-head"><div><div className="eyebrow">Cliënt / gezin</div><h1 className="page-title">Gezinsgegevens bewerken</h1><p className="page-subtitle">Pas de contactgegevens en interne informatie aan. Het klantnummer is permanent en kan niet worden gewijzigd.</p></div><Link className="btn secondary" href={`/clients/${id}`}>Annuleren</Link></div>
    <section className="panel"><form onSubmit={save}><div className="form-grid">
      <div className="full"><label className="label">Gezinsnaam *</label><input required className="input" value={f.name || ""} onChange={e => set("name", e.target.value)} /></div>
      <div><label className="label">Klantnummer</label><input className="input" value={f.reference || ""} readOnly aria-readonly="true" /></div>
      <div><label className="label">Algemeen e-mail</label><input className="input" type="email" value={f.email || ""} onChange={e => set("email", e.target.value)} /></div>
      <div><label className="label">Algemene telefoon</label><input className="input" value={f.phone || ""} onChange={e => set("phone", e.target.value)} /></div>
      <div className="full"><h2 className="panel-title">Persoon A</h2></div>
      <div><label className="label">Naam *</label><input required className="input" value={f.personAName || ""} onChange={e => set("personAName", e.target.value)} /></div><div><label className="label">E-mail</label><input className="input" type="email" value={f.personAEmail || ""} onChange={e => set("personAEmail", e.target.value)} /></div><div><label className="label">Telefoon</label><input className="input" value={f.personAPhone || ""} onChange={e => set("personAPhone", e.target.value)} /></div>
      <div className="full"><h2 className="panel-title">Persoon B</h2></div>
      <div><label className="label">Naam *</label><input required className="input" value={f.personBName || ""} onChange={e => set("personBName", e.target.value)} /></div><div><label className="label">E-mail</label><input className="input" type="email" value={f.personBEmail || ""} onChange={e => set("personBEmail", e.target.value)} /></div><div><label className="label">Telefoon</label><input className="input" value={f.personBPhone || ""} onChange={e => set("personBPhone", e.target.value)} /></div>
      <div className="full"><label className="label">Interne notities</label><textarea className="input" rows={5} value={f.notes || ""} onChange={e => set("notes", e.target.value)} /></div>
    </div>{err && <div className="notice error topgap">{err}</div>}<div className="actions topgap"><button className="btn" disabled={busy}>{busy ? "Opslaan…" : "Wijzigingen opslaan"}</button><Link className="btn secondary" href={`/clients/${id}`}>Annuleren</Link></div></form></section>
  </div>;
}
