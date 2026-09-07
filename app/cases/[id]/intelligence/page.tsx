import Link from "next/link";
import AppShell from "@/components/AppShell";
import CaseIntelligence from "@/components/CaseIntelligence";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessDossierHealth } from "@/lib/dossier-health";

export default async function Intelligence({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser(); const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: u.id }, include: { documents: { orderBy: { createdAt: "desc" } }, calculations: true } });
  if (!c) return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;
  const h = assessDossierHealth({ data: c.data, documents: c.documents, calculations: c.calculations.length });
  return <AppShell>
    <div className="page-head"><div><div className="eyebrow">Dossier intelligence · F5</div><h1 className="page-title">{c.name}</h1><p className="page-subtitle">Uitlegbare signalen, dossierkwaliteit en menselijke accordering.</p></div><div className="actions"><Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link><Link className="btn secondary" href={`/cases/${id}/review`}>Case Review</Link></div></div>
    <div className="result-hero"><div className="stat-card result-main"><div className="stat-label">DOSSIER COMPLEETHEID</div><div className="stat-value">{h.score}%</div><div className="stat-meta">{h.readyForCalculation ? "Basisgegevens compleet" : "Controlepunten aanwezig"}</div></div><div className="stat-card"><div className="stat-label">DOCUMENTEN</div><div className="stat-value">{c.documents.length}</div><div className="stat-meta">Gekoppeld</div></div><div className="stat-card"><div className="stat-label">GEANALYSEERD</div><div className="stat-value">{c.documents.filter(d => d.aiStatus === "COMPLETED").length}</div><div className="stat-meta">Door AI</div></div><div className="stat-card"><div className="stat-label">GEACCORDEERD</div><div className="stat-value">{c.documents.filter(d => d.approvedAt).length}</div><div className="stat-meta">Menselijk gecontroleerd</div></div></div>
    <CaseIntelligence caseId={id} />
    <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Dossier Health</h2><div className="panel-sub">Basiscontroles op volledigheid vóór berekening en rapportage.</div></div></div>{h.items.map(x => <div className="summary-line" key={x.key}><span><b>{x.status === "OK" ? "✓" : x.status === "WARNING" ? "⚠" : "!"} {x.label}</b><small style={{ display: "block" }}>{x.detail}</small></span><span className={`status ${x.status === "OK" ? "green" : "gray"}`}>{x.status}</span></div>)}</section>
    <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Menselijke accordering</h2><div className="panel-sub">AI kan voorstellen doen; alleen een professional bepaalt of informatie bruikbaar is.</div></div></div><div className="table-wrap"><table className="table"><thead><tr><th>Document</th><th>Status</th><th>Model</th><th>Accordering</th></tr></thead><tbody>{c.documents.map(d => <tr key={d.id}><td><a className="table-link" href={`/api/documents/${d.id}`} target="_blank">{d.name}</a></td><td>{d.aiStatus}</td><td>{d.aiModel || "—"}</td><td>{d.approvedAt ? "✓ Goedgekeurd" : "Te controleren"}</td></tr>)}</tbody></table></div></section>
  </AppShell>;
}
