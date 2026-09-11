import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateWorkScore } from "@/lib/work-score";

const date = (v: Date) => new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v));
const priorityLabel = (p: string) => ({ URGENT: "Urgent", HIGH: "Hoog", NORMAL: "Normaal", LOW: "Laag" } as Record<string, string>)[p] || p;
const priorityTone = (p: string) => p === "URGENT" ? "red" : p === "HIGH" ? "amber" : "green";
const reviewLabel = (v: string) => ({ FINAL: "Definitief", APPROVED: "Goedgekeurd", REVIEWED: "Gereviewd", READY_FOR_REVIEW: "Klaar voor review", IN_REVIEW: "In review", INCOMPLETE: "Te controleren" } as Record<string, string>)[v] || "Te controleren";

export default async function WorkPage() {
  const user = await requireUser();
  const [cases, tasks] = await Promise.all([
    db.case.findMany({
      where: { userId: user.id, status: { in: ["DRAFT", "CALCULATED"] } },
      include: {
        client: true,
        calculations: { orderBy: { createdAt: "desc" }, take: 2 },
        documents: { select: { aiStatus: true, incomeFacts: { select: { status: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.task.findMany({
      where: { userId: user.id, status: "OPEN" },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 20,
      include: { case: { select: { id: true, name: true } } },
    }),
  ]);

  const scored = cases.map(c => {
    const facts = c.documents.flatMap(d => d.incomeFacts);
    const proposed = facts.filter(f => f.status === "PROPOSED").length;
    const documentsAwaitingReview = c.documents.filter(d => (d.aiStatus === "COMPLETED" || d.aiStatus === "ANALYZED") && d.incomeFacts.some(f => f.status === "PROPOSED")).length;
    const documentAnalysisErrors = c.documents.filter(d => d.aiStatus === "FAILED").length;
    const latest = c.calculations[0];
    const score = calculateWorkScore({ reviewStatus: c.reviewStatus, calculationCount: c.calculations.length, proposedIncomeFacts: proposed, documentsAwaitingReview, documentAnalysisErrors, calculationStale: !!latest && new Date(latest.createdAt) < new Date(c.updatedAt) });
    return { c, score };
  }).sort((a, b) => b.score.score - a.score.score || new Date(b.c.updatedAt).getTime() - new Date(a.c.updatedAt).getTime());

  const counts = scored.reduce((acc, x) => { acc[x.score.priority]++; return acc; }, { URGENT: 0, HIGH: 0, NORMAL: 0, LOW: 0 } as Record<string, number>);
  const overdue = tasks.filter(t => t.dueAt && new Date(t.dueAt) < new Date()).length;
  const activeWork = counts.URGENT + counts.HIGH;

  return <AppShell>
    <div className="page-head">
      <div><div className="eyebrow">Werkplek · actiecentrum</div><h1 className="page-title">Mijn werkvoorraad</h1><p className="page-subtitle">Eén overzicht van dossiers die aandacht vragen, open taken en controlepunten.</p></div>
      <div className="actions"><Link className="btn secondary" href="/cases">Alle dossiers</Link><Link className="btn" href="/tasks">Open taken</Link></div>
    </div>

    <section className="result-overview">
      <div className="result-primary"><div className="stat-label">ACTIEF WERK</div><div className="result-amount">{activeWork}</div><div className="stat-meta">urgente en hoge prioriteit dossiers</div></div>
      <div className="result-metric"><div className="stat-label">URGENT</div><div className="metric-value">{counts.URGENT}</div><span>direct oppakken</span></div>
      <div className="result-metric"><div className="stat-label">HOOG</div><div className="metric-value">{counts.HIGH}</div><span>deze werkstroom</span></div>
      <div className="result-metric"><div className="stat-label">OPEN TAKEN</div><div className="metric-value">{tasks.length}{overdue > 0 ? <small style={{ marginLeft: 6, color: "#b91c1c" }}>· {overdue} te laat</small> : null}</div><span>professionele opvolging</span></div>
    </section>

    <section className="panel topgap">
      <div className="panel-head"><div><div className="section-kicker">Prioriteitswachtrij</div><h2 className="panel-title">Dossiers met het meeste werk eerst</h2><div className="panel-sub">De score is een uitlegbare workflowhint en verandert nooit de juridische berekening.</div></div></div>
      {scored.length === 0 ? <div className="empty">Geen actieve dossiers.</div> : <div className="table-wrap"><table className="table"><thead><tr><th>Dossier</th><th>Cliënt</th><th>Prioriteit</th><th>Review</th><th>Reden</th><th>Bijgewerkt</th><th></th></tr></thead><tbody>{scored.slice(0, 30).map(({ c, score }) => <tr key={c.id}><td><Link className="table-link" href={`/cases/${c.id}/workspace`}>{c.name}</Link></td><td>{c.client?.name || "—"}</td><td><span className={`status ${priorityTone(score.priority)}`}>{score.score}/100 · {priorityLabel(score.priority)}</span></td><td>{reviewLabel(c.reviewStatus)}</td><td><div className="table-note">{score.reasons[0] || "Geen openstaand controlepunt."}</div>{score.reasons.length > 1 && <div className="table-note">+{score.reasons.length - 1} andere</div>}</td><td>{date(c.updatedAt)}</td><td><Link className="btn secondary" href={`/cases/${c.id}/intelligence`}>Details</Link></td></tr>)}</tbody></table></div>}
    </section>

    <section className="panel topgap">
      <div className="panel-head"><div><div className="section-kicker">Opvolging</div><h2 className="panel-title">Open taken</h2><div className="panel-sub">Taken blijven expliciet en auditbaar; automatisering voert geen berekeningen of goedkeuringen zelfstandig uit.</div></div><Link className="btn secondary" href="/tasks">Volledige werkvoorraad →</Link></div>
      {tasks.length === 0 ? <div className="empty">Geen open taken.</div> : <div className="detail-grid">{tasks.slice(0, 6).map(task => <div className="detail-card" key={task.id}><div className="detail-card-head"><b>{task.title}</b><span className={`status ${task.priority === "URGENT" ? "red" : task.priority === "HIGH" ? "amber" : "gray"}`}>{task.priority}</span></div><p className="subtle">{task.description || "Geen omschrijving."}</p><div className="summary-line"><span>Dossier</span><b>{task.case ? task.case.name : "Algemene taak"}</b></div><div className="summary-line"><span>Deadline</span><b>{task.dueAt ? date(task.dueAt) : "Geen deadline"}</b></div></div>)}</div>}
    </section>

    <section className="panel topgap"><div className="panel-head"><div><div className="section-kicker">Werkverdeling</div><h2 className="panel-title">Prioriteitsoverzicht</h2></div></div><div className="detail-grid"><div className="detail-card"><div className="detail-card-head"><b>Urgent</b><span>{counts.URGENT} dossiers</span></div><p className="subtle">Ontbrekende berekeningen, fouten of meerdere gelijktijdige controlepunten krijgen voorrang.</p></div><div className="detail-card"><div className="detail-card-head"><b>Hoog</b><span>{counts.HIGH} dossiers</span></div><p className="subtle">Open review, goedkeuring of substantiële dossierwerkzaamheden.</p></div><div className="detail-card"><div className="detail-card-head"><b>Normaal</b><span>{counts.NORMAL} dossiers</span></div><p className="subtle">Werk dat gepland kan worden binnen de normale werkstroom.</p></div><div className="detail-card"><div className="detail-card-head"><b>Laag</b><span>{counts.LOW} dossiers</span></div><p className="subtle">Dossiers zonder relevante openstaande professionele acties.</p></div></div></section>
  </AppShell>;
}
