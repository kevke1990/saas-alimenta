import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateDossierPriority } from "@/lib/dossier-priority";

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

const priorityLabel = (level: "HIGH" | "MEDIUM" | "LOW") =>
  level === "HIGH" ? "HOOG" : level === "MEDIUM" ? "MIDDEL" : "LAAG";

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
    }),
    db.task.findMany({
      where: { userId: user.id, status: "OPEN", dueAt: { gte: start, lte: end } },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 25,
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

  const caseIds = openCases.map((item) => item.id);
  const [caseCalculations, caseDocuments, proposedIncomeFacts, activeNorm] = await Promise.all([
    caseIds.length
      ? db.calculation.findMany({
          where: { caseId: { in: caseIds } },
          orderBy: { createdAt: "desc" },
          select: { id: true, caseId: true, normVersion: true, createdAt: true },
        })
      : Promise.resolve([]),
    caseIds.length
      ? db.document.findMany({
          where: { userId: user.id, caseId: { in: caseIds }, approvedAt: null, aiStatus: { not: "NOT_ANALYZED" } },
          select: { id: true, caseId: true },
        })
      : Promise.resolve([]),
    caseIds.length
      ? db.incomeFact.findMany({
          where: { userId: user.id, caseId: { in: caseIds }, status: "PROPOSED" },
          select: { id: true, caseId: true },
        })
      : Promise.resolve([]),
    db.normVersion.findFirst({ where: { isActive: true }, orderBy: { effectiveFrom: "desc" }, select: { id: true, version: true } }),
  ]);

  const latestCalculationByCase = new Map<string, (typeof caseCalculations)[number]>();
  for (const calculation of caseCalculations) {
    if (!latestCalculationByCase.has(calculation.caseId)) latestCalculationByCase.set(calculation.caseId, calculation);
  }

  const documentCountByCase = new Map<string, number>();
  for (const document of caseDocuments) {
    if (document.caseId) documentCountByCase.set(document.caseId, (documentCountByCase.get(document.caseId) || 0) + 1);
  }
  const incomeFactCountByCase = new Map<string, number>();
  for (const fact of proposedIncomeFacts) {
    if (fact.caseId) incomeFactCountByCase.set(fact.caseId, (incomeFactCountByCase.get(fact.caseId) || 0) + 1);
  }

  const taskCaseIds = [...overdueTasks, ...todayTasks]
    .map((task) => task.caseId)
    .filter((id): id is string => Boolean(id));
  const overdueByCase = new Map<string, number>();
  for (const task of overdueTasks) if (task.caseId) overdueByCase.set(task.caseId, (overdueByCase.get(task.caseId) || 0) + 1);
  const todayByCase = new Map<string, number>();
  for (const task of todayTasks) if (task.caseId) todayByCase.set(task.caseId, (todayByCase.get(task.caseId) || 0) + 1);

  const priorities = new Map(
    openCases.map((item) => [
      item.id,
      calculateDossierPriority({
        reviewStatus: item.reviewStatus,
        hasCalculation: latestCalculationByCase.has(item.id),
        calculationNormVersion: latestCalculationByCase.get(item.id)?.normVersion,
        activeNormVersion: activeNorm?.version,
        proposedIncomeFacts: incomeFactCountByCase.get(item.id) || 0,
        documentsAwaitingReview: documentCountByCase.get(item.id) || 0,
        overdueTasks: overdueByCase.get(item.id) || 0,
        todayTasks: todayByCase.get(item.id) || 0,
      }),
    ]),
  );

  const prioritizedCases = [...openCases].sort((a, b) => {
    const scoreDiff = (priorities.get(b.id)?.score || 0) - (priorities.get(a.id)?.score || 0);
    return scoreDiff || a.updatedAt.getTime() - b.updatedAt.getTime();
  });

  const relatedIds = [...overdueTasks, ...todayTasks]
    .map((task) => task.clientId)
    .filter((id): id is string => Boolean(id));
  const uniqueTaskCaseIds = [...new Set(taskCaseIds)];

  const [taskClients, taskCases] = await Promise.all([
    relatedIds.length
      ? db.client.findMany({ where: { userId: user.id, id: { in: [...new Set(relatedIds)] } } })
      : Promise.resolve([]),
    uniqueTaskCaseIds.length
      ? db.case.findMany({ where: { userId: user.id, id: { in: uniqueTaskCaseIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);

  const clientsById = new Map(taskClients.map((client) => [client.id, client.name]));
  const casesById = new Map(taskCases.map((item) => [item.id, item.name]));

  const taskRow = (task: (typeof overdueTasks)[number], overdue = false) => (
    <tr key={task.id}>
      <td><strong>{task.title}</strong>{task.description && <div className="stat-meta">{task.description}</div>}</td>
      <td>{(task.clientId && clientsById.get(task.clientId)) || (task.caseId && casesById.get(task.caseId)) || "—"}</td>
      <td>{task.priority}</td>
      <td>{task.dueAt ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(task.dueAt) : "—"}</td>
      <td>{overdue ? <span className="status amber">VERLOPEN</span> : <span className="status green">VANDAAG</span>}</td>
    </tr>
  );

  return (
    <AppShell>
      <div className="page-head">
        <div>
          <div className="eyebrow">Fase F · F2 Dossierprioritering</div>
          <h1 className="page-title">Wat vraagt aandacht?</h1>
          <p className="page-subtitle">Eén overzicht van open taken en dossiers, met een uitlegbare prioriteitsscore. De score is een werksignaal en geen juridisch oordeel.</p>
        </div>
        <div className="actions">
          <Link className="btn secondary" href="/dashboard">← Dashboard</Link>
          <Link className="btn" href="/cases">Alle dossiers →</Link>
        </div>
      </div>

      <div className="dashboard-grid topgap">
        <div className="stat-card"><div className="stat-label">VERLOPEN TAKEN</div><div className="stat-value">{overdueTasks.length}</div><div className="stat-meta">Open taken met een verstreken deadline</div></div>
        <div className="stat-card"><div className="stat-label">VANDAAG</div><div className="stat-value">{todayTasks.length}</div><div className="stat-meta">Open taken voor vandaag</div></div>
        <div className="stat-card"><div className="stat-label">DOSSIER SIGNALEN</div><div className="stat-value">{prioritizedCases.filter((item) => (priorities.get(item.id)?.score || 0) >= 30).length}</div><div className="stat-meta">Dossiers met middelhoge of hoge prioriteit</div></div>
      </div>

      <section className="panel topgap">
        <div className="panel-head"><div><div className="section-kicker">F2 · Uitlegbare score</div><h2 className="panel-title">Dossierprioriteit</h2><div className="panel-sub">De score combineert alleen concrete workflowsignalen: reviewstatus, openstaande goedkeuringen, document-/AI-review, normversie en taken.</div></div></div>
        {prioritizedCases.length === 0 ? <div className="empty">Geen dossiers die opvolging vragen.</div> : <div className="table-wrap"><table className="table"><thead><tr><th>Dossier</th><th>Cliënt</th><th>Prioriteit</th><th>Signalen</th><th>Bijgewerkt</th><th></th></tr></thead><tbody>{prioritizedCases.map((c) => { const priority = priorities.get(c.id)!; return <tr key={c.id}><td><Link className="table-link" href={`/cases/${c.id}`}>{c.name}</Link></td><td>{c.client?.name || "—"}</td><td><strong>{priority.score}/100</strong><div className="stat-meta">{priorityLabel(priority.level)}</div></td><td>{priority.signals.length === 0 ? "Geen extra signalen" : <>{priority.signals.slice(0, 3).map((signal) => <div key={signal.key} className="stat-meta">+{signal.points} · {signal.label}</div>)}{priority.signals.length > 3 && <div className="stat-meta">+ {priority.signals.length - 3} meer</div>}</>}</td><td>{new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(c.updatedAt)}</td><td><Link className="btn ghost" href={`/cases/${c.id}/workflow`}>Open workflow →</Link></td></tr>; })}</tbody></table></div>}
      </section>

      <section className="panel topgap">
        <div className="panel-head"><div><div className="section-kicker">Prioriteit 1</div><h2 className="panel-title">Achterstallige taken</h2><div className="panel-sub">Deze taken verdienen als eerste aandacht.</div></div></div>
        {overdueTasks.length === 0 ? <div className="empty">Geen achterstallige open taken.</div> : <div className="table-wrap"><table className="table"><thead><tr><th>Taak</th><th>Dossier/cliënt</th><th>Prioriteit</th><th>Deadline</th><th>Status</th></tr></thead><tbody>{overdueTasks.map(t => taskRow(t, true))}</tbody></table></div>}
      </section>

      <section className="panel topgap">
        <div className="panel-head"><div><div className="section-kicker">Prioriteit 2</div><h2 className="panel-title">Taken voor vandaag</h2><div className="panel-sub">Werk dat vandaag gepland staat.</div></div></div>
        {todayTasks.length === 0 ? <div className="empty">Geen open taken gepland voor vandaag.</div> : <div className="table-wrap"><table className="table"><thead><tr><th>Taak</th><th>Dossier/cliënt</th><th>Prioriteit</th><th>Deadline</th><th>Status</th></tr></thead><tbody>{todayTasks.map(t => taskRow(t))}</tbody></table></div>}
      </section>

      <section className="panel topgap">
        <div className="panel-head"><div><div className="section-kicker">Uitlegbaarheid</div><h2 className="panel-title">Geen automatische juridische beslissing</h2><div className="panel-sub">Alimenta Pro gebruikt deze signalen alleen om werk te ordenen. Een professional bepaalt zelf wat inhoudelijk moet gebeuren; berekeningen en reviewstatussen worden niet automatisch aangepast.</div></div></div>
      </section>
    </AppShell>
  );
}
