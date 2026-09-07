"use client";
import { useEffect, useState } from "react";

type Signal = { key:string; title:string; explanation:string; evidence:string[]; action:string; severity:"CRITICAL"|"HIGH"|"MEDIUM"|"LOW"|"INFO"; confidence:number; category:string };
const labels: Record<string,string> = { CRITICAL:"KRITIEK", HIGH:"HOOG", MEDIUM:"MIDDEL", LOW:"LAAG", INFO:"INFO" };
export default function CaseIntelligence({ caseId }: { caseId:string }) {
  const [signals,setSignals]=useState<Signal[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  useEffect(()=>{fetch(`/api/cases/${caseId}/intelligence`).then(async r=>{if(!r.ok) throw new Error(await r.text()); return r.json()}).then(d=>setSignals(d.signals||[])).catch(e=>setError(e.message||"Laden mislukt.")).finally(()=>setLoading(false))},[caseId]);
  return <section className="panel topgap"><div className="panel-head"><div><div className="section-kicker">F5 · Explainable intelligence</div><h2 className="panel-title">Intelligente controles</h2><div className="panel-sub">Controleerbare signalen met bron, reden en voorgestelde vervolgstap. Niets wordt automatisch aangepast.</div></div></div>
    {loading ? <div className="empty">Signalen analyseren…</div> : error ? <div className="empty">{error}</div> : signals.length===0 ? <div className="empty">Geen aanvullende signalen gevonden. Dat betekent niet dat het dossier inhoudelijk definitief juist is.</div> : <div className="dashboard-grid">{signals.map(s=><article key={s.key} className="stat-card"><div className="stat-label">{s.category} · {labels[s.severity]}</div><h3 className="panel-title">{s.title}</h3><p>{s.explanation}</p><div className="stat-meta"><strong>Bewijs</strong>{s.evidence.map((e,i)=><div key={i}>{e}</div>)}</div><div className="stat-meta topgap"><strong>Vervolgstap</strong><div>{s.action}</div><div>Confidence: {Math.round(s.confidence*100)}%</div></div></article>)}</div>}
  </section>;
}
