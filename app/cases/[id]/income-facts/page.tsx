import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const money = (v: any) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(Number(v) || 0);
const statusLabel = (s: string) => s === "APPROVED" ? "Goedgekeurd" : s === "REJECTED" ? "Afgewezen" : "Voorstel";
const statusClass = (s: string) => s === "APPROVED" ? "green" : s === "REJECTED" ? "red" : "amber";

export default async function IncomeFactsPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: u.id }, include: { client: true, incomeFacts: { include: { document: { select: { id: true, name: true, aiStatus: true } } }, orderBy: { createdAt: "desc" } } } });
  if (!c) return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;

  const facts = c.incomeFacts;
  const proposed = facts.filter(f => f.status === "PROPOSED").length;
  const approved = facts.filter(f => f.status === "APPROVED").length;
  const rejected = facts.filter(f => f.status === "REJECTED").length;
  const locked = c.reviewStatus === "APPROVED" || c.reviewStatus === "FINAL";

  return <AppShell>
    <div className="page-head">
      <div><div className="eyebrow">Fase B · AI & gegevenscontrole</div><h1 className="page-title">AI-inkomensfeiten controleren</h1><p className="page-subtitle">{c.name} · {c.client?.name || "Zonder cliënt"}</p></div>
      <div className="actions"><Link className="btn secondary" href={`/cases/${id}/documenten`}>← Documenten</Link><Link className="btn secondary" href={`/cases/${id}`}>Dossier</Link><Link className="btn" href={`/cases/${id}/edit/wizard`}>{locked ? "Berekening bekijken" : "Wijzig berekening →"}</Link></div>
    </div>

    <div className="result-hero">
      <div className="stat-card result-main"><div className="stat-label">AI-VOORSTELLEN</div><div className="stat-value">{proposed}</div><div className="stat-meta">Wachten op professionele beoordeling</div></div>
      <div className="stat-card"><div className="stat-label">GOEDGEKEURD</div><div className="stat-value">{approved}</div><div className="stat-meta">Professioneel bevestigd</div></div>
      <div className="stat-card"><div className="stat-label">AFGEWEZEN</div><div className="stat-value">{rejected}</div><div className="stat-meta">Niet gebruiken</div></div>
      <div className="stat-card"><div className="stat-label">TOTAAL</div><div className="stat-value">{facts.length}</div><div className="stat-meta">Geëxtraheerde feiten</div></div>
    </div>

    {proposed > 0 && <div className="notice topgap">Er staan <strong>{proposed} AI-voorstellen</strong> klaar. Kies bij goedkeuring eerst de juiste ouder. Daarna kun je via <strong>Wijzig berekening</strong> de relevante waarden in het bestaande dossier verwerken; opslaan maakt een nieuwe immutable calculation snapshot.</div>}
    {proposed === 0 && approved > 0 && <div className="notice success topgap"><strong>{approved} feiten zijn professioneel goedgekeurd.</strong> Ouder-toewijzing en goedkeuring zijn vastgelegd in de audittrail. Verwerk gewenste waarden via de bestaande berekeningswizard; alleen daar ontstaat een nieuwe calculation snapshot.</div>}
    {locked && <div className="notice topgap">Dit dossier is <strong>{c.reviewStatus}</strong>. De berekening is vergrendeld; feiten kunnen pas worden aangepast nadat de professionele workflow het dossier weer wijzigbaar maakt.</div>}

    <section className="panel topgap">
      <div className="panel-head"><div><h2 className="panel-title">Fact review</h2><div className="panel-sub">AI mag een waarde voorstellen, maar alleen een professional kan het feit accorderen en aan ouder A of B koppelen. Goedkeuren en herberekenen zijn bewust twee afzonderlijke stappen.</div></div></div>
      {facts.length === 0 ? <div className="empty">Nog geen AI-inkomensfeiten gevonden. Analyseer eerst een document vanuit de dossierpagina.</div> :
        <div className="table-wrap"><table className="table"><thead><tr><th>Feit</th><th>Waarde</th><th>Bron</th><th>Ouder</th><th>Betrouwbaarheid</th><th>Status</th><th>Actie</th></tr></thead><tbody>
          {facts.map(f => <tr key={f.id}>
            <td><b>{f.label}</b><div className="table-note">{f.key}</div></td>
            <td>{f.valueNumber != null ? money(f.valueNumber) : f.valueText || "—"}{f.unit ? <div className="table-note">{f.unit}</div> : null}</td>
            <td><a className="table-link" href={`/api/documents/${f.document.id}`} target="_blank" rel="noreferrer">{f.document.name}</a>{f.page ? <div className="table-note">pagina {f.page}</div> : null}</td>
            <td>{f.status === "APPROVED" ? (f.parentIndex === 0 ? "Ouder A" : "Ouder B") : <select className="input" name="parentIndex" form={`fact-${f.id}`} defaultValue={f.parentIndex == null ? "" : String(f.parentIndex)} disabled={locked}><option value="">Kies ouder</option><option value="0">Ouder A</option><option value="1">Ouder B</option></select>}</td>
            <td>{f.confidence == null ? "—" : `${Math.round(f.confidence * 100)}%`}{f.sourceHint ? <div className="table-note">{f.sourceHint}</div> : null}</td>
            <td><span className={`status ${statusClass(f.status)}`}>{statusLabel(f.status)}</span></td>
            <td><div className="actions">
              {f.status !== "APPROVED" && <form id={`fact-${f.id}`} action={`/api/cases/${id}/income-facts`} method="post"><input type="hidden" name="factId" value={f.id}/><input type="hidden" name="status" value="APPROVED"/><button className="btn ghost" type="submit" disabled={locked}>✓ Goedkeuren</button></form>}
              {f.status !== "REJECTED" && <form action={`/api/cases/${id}/income-facts`} method="post"><input type="hidden" name="factId" value={f.id}/><input type="hidden" name="status" value="REJECTED"/><button className="btn ghost" type="submit" disabled={locked}>Afwijzen</button></form>}
              {f.status !== "PROPOSED" && <form action={`/api/cases/${id}/income-facts`} method="post"><input type="hidden" name="factId" value={f.id}/><input type="hidden" name="status" value="PROPOSED"/><button className="btn ghost" type="submit" disabled={locked}>Heropen</button></form>}
            </div></td>
          </tr>)}
        </tbody></table></div>}
    </section>

    <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Professionele gegevensketen</h2><div className="panel-sub">De volledige B-workflow blijft controleerbaar en reproduceerbaar.</div></div></div>
      <div className="notice success">Document → AI-extractie → voorgesteld feit → ouder toewijzen → professionele goedkeuring → verwerking in bestaande berekening → nieuwe calculation snapshot → review opnieuw uitvoeren.</div>
      <div className="actions topgap"><Link className="btn secondary" href={`/cases/${id}/documenten`}>Documentregister</Link><Link className="btn" href={`/cases/${id}/edit/wizard`}>Naar bestaande berekening →</Link><Link className="btn secondary" href={`/cases/${id}/review`}>Volledige review</Link></div>
    </section>
  </AppShell>;
}
