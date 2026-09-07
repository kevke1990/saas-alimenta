import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

function dayStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayEnd(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

const reviewLabel = (value: string) =>
  value === "FINAL"
    ? "Definitief"
    : value === "APPROVED"
      ? "Goedgekeurd"
      : value === "REVIEWED"
        ? "Gereviewd"
        : value === "READY_FOR_REVIEW"
          ? "Klaar voor review"
          : "Te controleren";

export default async function AttentionCenter() {
  const user = await requireUser();
  const now = new Date();
  const start = dayStart(now);
  const end = dayEnd(now);

  const [overdueTasks, todayTasks, openCases] = await Promise.all([
    db.task.findMany({
      where: { userId: user.id, status: "OPEN", dueAt: { lt: start } },
      orderBy: { dueAt: "asc" },
      take: 25,
      include: { case: true, client: true },
    }),
    db.task.findMany({
      where: { userId: user.id, status: "OPEN", dueAt: { gte: start, lte: end } },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 25,
      include: { case: true, client: true },
    }),
    db.case.findMany({
      where: {
        userId: user.id,
        reviewStatus: { in: ["READY_FOR_REVIEW", "REVIEWED", "INCOMPLETE"] },
      },
      orderBy: { updatedAt: "asc" },
      take: 25,
      include: { client: true },
    }),
  ]);

  const taskRow = (task: (typeof overdueTasks)[number], overdue = false) => (
    <tr key={task.id}>
      <td>
        <strong>{task.title}</strong>
        {task.description && <div className="stat-meta">{task.description}</div>}
      </td>
      <td>{task.client?.name || task.case?.name || "—"}</td>
      <td>{task.priority}</td>
      <td>{task.dueAt ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(task.dueAt) : "—"}</td>
      <td>{overdue ? <span className="status amber">VERLOPEN</span> : <span className="status green">VANDAAG</span>}</td>
    </tr>
  );

  return (
    <AppShell>
      <div className="page-head">
        <div>
          <div className="eyebrow">Fase F · Actiecentrum</div>
          <h1 className="page-title">Wat vraagt aandacht?</h1>
          <p className="page-subtitle">Eén overzicht van open taken, achterstallig werk en dossiers die nog professionele opvolging nodig hebben.</p>
        </div>
        <div className="actions">
          <Link className="btn secondary" href="/dashboard">← Dashboard</Link>
          <Link className="btn" href="/cases">Alle dossiers →</Link>
        </div>
      </div>

      <div className="dashboard-grid topgap">
        <div className="stat-card"><div className="stat-label">VERLOPEN TAKEN</div><div className="stat-value">{overdueTasks.length}</div><div className="stat-meta">Open taken met een verstreken deadline</div></div>
        <div className="stat-card"><div className="stat-label">VANDAAG</div><div className="stat-value">{todayTasks.length}</div><div className="stat-meta">Open taken voor vandaag</div></div>
        <div className="stat-card"><div className="stat-label">OPEN DOSSIERS</div><div className="stat-value">{openCases.length}</div><div className="stat-meta">Dossiers die nog opvolging vragen</div></div>
      </div>

      <section className="panel topgap">
        <div className="panel-head"><div><div className="section-kicker">Prioriteit 1</div><h2 className="panel-title">Achterstallige taken</h2><div className="panel-sub">Deze taken verdienen als eerste aandacht.</div></div></div>
        {overdueTasks.length === 0 ? <div className="empty">Geen achterstallige open taken.</div> : <div className="table-wrap"><table className="table"><thead><tr><th>Taak</th><th>Dossier/cliënt</th><th>Prioriteit</th><th>Deadline</th><th>Status</th></tr></thead><tbody>{overdueTasks.map(t => taskRow(t, true))}</tbody></table></div>}
      </section>

      <section className="panel topgap">
        <div className="panel-head"><div><div className="section-kicker">Prioriteit 2</div><h2 className="panel-title">Taken voor vandaag</h2><div className="panel-sub">Werk dat vandaag gepland staat.</div></div></div>
        {todayTasks.length === 0 ? <div className="empty">Geen open taken gepland voor vandaag.</div> : <div className="table-wrap"><table className="table"><thead><tr><th>Taak</th><th>Dossier/cliënt</th><th>Prioriteit</th><th>Deadline</th><th>Status</th></tr></thead><tbody>{todayTasks.map(t => taskRow(t))}</tbody></table></div>}
      </section>

      <section className="panel topgap">
        <div className="panel-head"><div><div className="section-kicker">Prioriteit 3</div><h2 className="panel-title">Dossiers met opvolging</h2><div className="panel-sub">Oudste open dossiers eerst, zodat werk niet stil blijft liggen.</div></div></div>
        {openCases.length === 0 ? <div className="empty">Geen open dossiers.</div> : <div className="table-wrap"><table className="table"><thead><tr><th>Dossier</th><th>Cliënt</th><th>Status</th><th>Bijgewerkt</th><th></th></tr></thead><tbody>{openCases.map(c => <tr key={c.id}><td><Link className="table-link" href={`/cases/${c.id}`}>{c.name}</Link></td><td>{c.client?.name || "—"}</td><td><span className="status amber">{reviewLabel(c.reviewStatus)}</span></td><td>{new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(c.updatedAt)}</td><td><Link className="btn ghost" href={`/cases/${c.id}/workflow`}>Open workflow →</Link></td></tr>)}</tbody></table></div>}
      </section>
    </AppShell>
  );
}
