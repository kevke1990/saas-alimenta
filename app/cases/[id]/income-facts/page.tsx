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
  const c = await db.case.findFirst({
    where: { id, userId: u.id },
    include: {
      client: true,
      incomeFacts: { include: { document: { select: { id: true, name: true, aiStatus: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!c) return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;

  const facts = c.incomeFacts;
  const proposed = facts.filter(f => f.status === "PROPOSED").length;
  const approved = facts.filter(f => f.status === "APPROVED").length;
  const rejected = facts.filter(f => f.status === "REJECTED").length;

  return <AppShell>
    <div className="page-head">
      <div><div className="eyebrow">Fase C · AI & gegevenscontrole</div><h1 className="page-title">AI-inkomensfeiten controleren</h1><p className="page-subtitle">{c.name} · {c.client?.name || "Zonder cliënt"}</p></div>
      <div className="actions"><Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link><Link className="btn secondary" href={`/cases/${id}/review`}>Professionele review</Link></div>
    </div>

    <div className="result-hero">
      <div className="stat-card result-main"><div className="stat-label">AI-VOORSTELLEN</div><div className="stat-value">{proposed}</div><div className="stat-meta">Wachten op professionele beoordeling</div></div>
      <div className="stat-card"><div className="stat-label">GOEDGEKEURD</div><div className="stat-value">{approved}</div><div className="stat-meta">Professioneel bevestigd</div></div>
      <div className="stat-card"><div className="stat-label">AFGEWEZEN</div><div className="stat-value">{rejected}</div><div className="stat-meta">Niet gebruiken</div></div>
      <div className="stat-card"><div className="stat-label">TOTAAL</div><div className="stat-value">{facts.length}</div><div className="stat-meta">Geëxtraheerde feiten</div></div>
    </div>

    <section className="panel topgap">
      <div className="panel-head"><div><h2 className="panel-title">Fact review</h2><div className="panel-sub">AI mag een waarde voorstellen, maar alleen een professional kan het feit accorderen voor gebruik in de verdere dossierworkflow.</div></div></div>
      {facts.length === 0 ? <div className="empty">Nog geen AI-inkomensfeiten gevonden. Analyseer eerst een document vanuit de dossierpagina.</div> :
        <div className="table-wrap"><table className="table"><thead><tr><th>Feit</th><th>Waarde</th><th>Bron</th><th>Betrouwbaarheid</th><th>Status</th><th>Actie</th></tr></thead><tbody>
          {facts.map(f => <tr key={f.id}>
            <td><b>{f.label}</b><div className="table-note">{f.key} · ouder {f.parentIndex == null ? "onbekend" : String.fromCharCode(65 + f.parentIndex)}</div></td>
            <td>{f.valueNumber != null ? money(f.valueNumber) : f.valueText || "—"}{f.unit ? <div className="table-note">{f.unit}</div> : null}</td>
            <td><a className="table-link" href={`/api/documents/${f.document.id}`} target="_blank" rel="noreferrer">{f.document.name}</a>{f.page ? <div className="table-note">pagina {f.page}</div> : null}</td>
            <td>{f.confidence == null ? "—" : `${Math.round(f.confidence * 100)}%`}{f.sourceHint ? <div className="table-note">{f.sourceHint}</div> : null}</td>
            <td><span className={`status ${statusClass(f.status)}`}>{statusLabel(f.status)}</span></td>
            <td><div className="actions">
              {f.status !== "APPROVED" && <form action={`/api/cases/${id}/income-facts`} method="post"><input type="hidden" name="factId" value={f.id}/><input type="hidden" name="status" value="APPROVED"/><button className="btn ghost" type="submit">✓ Goedkeuren</button></form>}
              {f.status !== "REJECTED" && <form action={`/api/cases/${id}/income-facts`} method="post"><input type="hidden" name="factId" value={f.id}/><input type="hidden" name="status" value="REJECTED"/><button className="btn ghost" type="submit">Afwijzen</button></form>}
              {f.status !== "PROPOSED" && <form action={`/api/cases/${id}/income-facts`} method="post"><input type="hidden" name="factId" value={f.id}/><input type="hidden" name="status" value="PROPOSED"/><button className="btn ghost" type="submit">Heropen</button></form>}
            </div></td>
          </tr>)}
        </tbody></table></div>}
    </section>

    <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Veilige gegevensketen</h2><div className="panel-sub">Deze pagina maakt de overgang van AI-extractie naar professionele beoordeling expliciet.</div></div></div>
      <div className="notice success">Document → AI-extractie → voorgesteld feit → professionele goedkeuring → pas daarna beschikbaar voor de verdere workflow.</div>
      <div className="notice topgap">Het goedkeuren van een feit wijzigt niet automatisch de berekening. Een berekening wordt pas opnieuw uitgevoerd via de normale berekenings-/dossierworkflow, zodat iedere wijziging een nieuwe calculation snapshot en auditspoor kan krijgen.</div>
    </section>
  </AppShell>;
}
