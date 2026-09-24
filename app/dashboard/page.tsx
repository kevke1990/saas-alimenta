import Link from "next/link";
import AppShell from "@/components/AppShell";
import DemoStarter from "@/components/DemoStarter";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

function euro(value: unknown) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function reviewLabel(value: string) {
  if (value === "FINAL") return "Definitief";
  if (value === "APPROVED") return "Goedgekeurd";
  if (value === "REVIEWED") return "Gereviewd";
  if (value === "READY_FOR_REVIEW") return "Klaar voor review";
  return "Te controleren";
}

function reviewClass(value: string) {
  if (value === "FINAL" || value === "APPROVED") return "green";
  if (value === "REVIEWED" || value === "READY_FOR_REVIEW") return "amber";
  return "gray";
}

type DashboardIconName = "clients" | "cases" | "documents" | "tasks" | "sparkles" | "calculator" | "arrow";

function DashboardIcon({ name }: { name: DashboardIconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "clients") return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  if (name === "cases") return <svg {...common}><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h4l2 2h7A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z"/></svg>;
  if (name === "documents") return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>;
  if (name === "tasks") return <svg {...common}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
  if (name === "sparkles") return <svg {...common}><path d="m12 3-1.2 3.3a4 4 0 0 1-2.5 2.5L5 10l3.3 1.2a4 4 0 0 1 2.5 2.5L12 17l1.2-3.3a4 4 0 0 1 2.5-2.5L19 10l-3.3-1.2a4 4 0 0 1-2.5-2.5zM5 18v3M3.5 19.5h3"/></svg>;
  if (name === "calculator") return <svg {...common}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8v4H8zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>;
  return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
}

export default async function Dashboard() {
  const user = await requireUser();
  const [clients, cases, reviewQueue, latestWithResult, calculations, readyCount, reviewedCount, incompleteCount, documentCount, proposedFactCount, openTaskCount] = await Promise.all([
    db.client.count({ where: { userId: user.id, status: "ACTIVE" } }),
    db.case.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 12, include: { client: true } }),
    db.case.findMany({
      where: { userId: user.id, reviewStatus: { notIn: ["FINAL", "APPROVED"] } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { client: true },
    }),
    db.case.findFirst({
      where: { userId: user.id, result: { not: null } },
      orderBy: { updatedAt: "desc" },
    }),
    db.calculation.count({ where: { case: { userId: user.id } } }),
    db.case.count({ where: { userId: user.id, reviewStatus: "READY_FOR_REVIEW" } }),
    db.case.count({ where: { userId: user.id, reviewStatus: "REVIEWED" } }),
    db.case.count({ where: { userId: user.id, reviewStatus: "INCOMPLETE" } }),
    db.document.count({ where: { userId: user.id } }),
    db.incomeFact.count({ where: { userId: user.id, status: "PROPOSED" } }),
    db.task.count({ where: { userId: user.id, status: "OPEN" } }),
  ]);

  const latestResult = latestWithResult?.result as { totalNeed?: unknown } | null | undefined;
  const workQueue = reviewQueue;
  const attentionCount = readyCount + reviewedCount + incompleteCount;
  const firstName = user.name?.split(" ")[0] || "welkom";
  const dateLabel = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <AppShell>
      <div className="dashboard-page">
        <header className="dashboard-welcome">
          <div>
            <div className="eyebrow">{dateLabel}</div>
            <h1 className="page-title">Goedemorgen, {firstName}.</h1>
            <p className="page-subtitle">Je actuele cliënten, dossiers en professionele werkvoorraad in één overzicht.</p>
          </div>
          <div className="actions dashboard-actions" aria-label="Snel toevoegen">
            <Link className="btn secondary" href="/clients/new"><span aria-hidden>+</span> Cliënt</Link>
            <Link className="btn" href="/cases/new">Nieuwe berekening <DashboardIcon name="arrow" /></Link>
          </div>
        </header>

        <section className="dashboard-kpis" aria-label="Praktijkoverzicht">
          <article className="dashboard-kpi">
            <div className="dashboard-kpi-head"><span className="stat-label">Actieve cliënten</span><span className="dashboard-kpi-icon" aria-hidden><DashboardIcon name="clients" /></span></div>
            <div className="stat-value al-tabular">{clients}</div>
            <div className="stat-meta">Cliënten in je praktijk</div>
          </article>
          <article className="dashboard-kpi">
            <div className="dashboard-kpi-head"><span className="stat-label">Berekeningen</span><span className="dashboard-kpi-icon" aria-hidden><DashboardIcon name="calculator" /></span></div>
            <div className="stat-value al-tabular">{calculations}</div>
            <div className="stat-meta">Opgeslagen rekenmomenten</div>
          </article>
          <article className="dashboard-kpi">
            <div className="dashboard-kpi-head"><span className="stat-label">Open taken</span><span className="dashboard-kpi-icon" aria-hidden><DashboardIcon name="tasks" /></span></div>
            <div className="stat-value al-tabular">{openTaskCount}</div>
            <div className="stat-meta">Professionele opvolging</div>
          </article>
          <article className="dashboard-kpi dashboard-kpi-accent">
            <div className="dashboard-kpi-head"><span className="stat-label">Aandacht nodig</span><span className="dashboard-kpi-icon" aria-hidden><DashboardIcon name="sparkles" /></span></div>
            <div className="stat-value al-tabular">{attentionCount}</div>
            <div className="stat-meta">Dossiers in de reviewstroom</div>
          </article>
        </section>

        <div className="dashboard-meta-strip" aria-label="Aanvullend overzicht">
          <div><span className="dashboard-meta-icon" aria-hidden><DashboardIcon name="cases" /></span><strong>{cases.length}</strong><span>recente dossiers</span></div>
          <div><span className="dashboard-meta-icon" aria-hidden><DashboardIcon name="documents" /></span><strong>{documentCount}</strong><span>documenten</span></div>
          <div><span className="dashboard-meta-icon" aria-hidden><DashboardIcon name="sparkles" /></span><strong>{proposedFactCount}</strong><span>AI-voorstellen te beoordelen</span></div>
          <div className="dashboard-plan"><span>Abonnement</span><strong>{user.plan}</strong><small>{user.subscriptionStatus || "Geen actief abonnement"}</small></div>
        </div>

        <div className="dashboard-primary-grid">
          <section className="panel dashboard-work-panel">
            <div className="panel-head">
              <div><div className="section-kicker">Werkvoorraad</div><h2 className="panel-title">Wat vraagt vandaag aandacht?</h2><div className="panel-sub">Dossiers die nog professionele beoordeling of goedkeuring vragen.</div></div>
              <Link className="btn ghost" href="/cases">Alle dossiers <span aria-hidden>→</span></Link>
            </div>

            <div className="dashboard-review-grid">
              <Link className="dashboard-review-card" href="/cases?review=READY_FOR_REVIEW"><span>Klaar voor review</span><strong className="al-tabular">{readyCount}</strong><small>Open professionele review</small></Link>
              <Link className="dashboard-review-card" href="/cases?review=REVIEWED"><span>Na review</span><strong className="al-tabular">{reviewedCount}</strong><small>Klaar voor goedkeuring</small></Link>
              <Link className="dashboard-review-card" href="/cases?review=INCOMPLETE"><span>Aandacht nodig</span><strong className="al-tabular">{incompleteCount}</strong><small>Invoer nog niet compleet</small></Link>
            </div>

            {workQueue.length === 0 ? (
              <div className="dashboard-empty"><span className="dashboard-empty-icon" aria-hidden><DashboardIcon name="tasks" /></span><div><strong>Werkvoorraad bijgewerkt</strong><p>Alle recente dossiers zijn goedgekeurd of definitief.</p></div></div>
            ) : (
              <div className="table-wrap dashboard-table-wrap">
                <table className="table">
                  <thead><tr><th>Dossier</th><th>Cliënt</th><th>Status</th><th>Bijgewerkt</th><th><span className="sr-only">Actie</span></th></tr></thead>
                  <tbody>{workQueue.map((item) => <tr key={item.id}>
                    <td><Link className="table-link" href={`/cases/${item.id}`}>{item.name}</Link></td>
                    <td>{item.client?.name || "—"}</td>
                    <td><span className={`status ${reviewClass(item.reviewStatus)}`}>{reviewLabel(item.reviewStatus)}</span></td>
                    <td>{new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "short", year: "numeric" }).format(item.updatedAt)}</td>
                    <td><Link className="dashboard-row-link" href={`/cases/${item.id}/workflow`} aria-label={`Open workflow voor ${item.name}`}>→</Link></td>
                  </tr>)}</tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="dashboard-side-stack" aria-label="Snel starten en laatste resultaat">
            <section className="panel dashboard-quick-panel">
              <div className="section-kicker">Snel starten</div>
              <h2 className="panel-title">Veelgebruikte acties</h2>
              <div className="dashboard-quick-list">
                <Link href="/cases/new" className="dashboard-quick-link"><span className="dashboard-quick-icon" aria-hidden><DashboardIcon name="calculator" /></span><span><b>Nieuwe berekening</b><small>Start een nieuw dossier</small></span><DashboardIcon name="arrow" /></Link>
                <Link href="/clients/new" className="dashboard-quick-link"><span className="dashboard-quick-icon" aria-hidden><DashboardIcon name="clients" /></span><span><b>Cliënt toevoegen</b><small>Leg cliëntgegevens vast</small></span><DashboardIcon name="arrow" /></Link>
                <Link href="/tasks" className="dashboard-quick-link"><span className="dashboard-quick-icon" aria-hidden><DashboardIcon name="tasks" /></span><span><b>Open taken</b><small>Bekijk professionele opvolging</small></span><DashboardIcon name="arrow" /></Link>
              </div>
            </section>

            {latestWithResult ? <section className="dashboard-result-card">
              <span className="stat-label">Laatste resultaat</span>
              {latestResult?.totalNeed != null ? <strong>{euro(latestResult.totalNeed)}</strong> : null}
              <span>Behoefte · {latestWithResult.name}</span>
              <Link href={`/cases/${latestWithResult.id}`}>Bekijk dossier <span aria-hidden>→</span></Link>
            </section> : null}
          </aside>
        </div>

        <section className="panel dashboard-recent-panel">
          <div className="panel-head"><div><div className="section-kicker">Recent</div><h2 className="panel-title">Laatst bijgewerkte dossiers</h2><div className="panel-sub">De twaalf meest recent gewijzigde dossiers uit je praktijk.</div></div><Link className="btn ghost" href="/cases/new">Nieuw dossier <span aria-hidden>→</span></Link></div>
          {cases.length === 0 ? (
            <div className="dashboard-empty dashboard-empty-large"><span className="dashboard-empty-icon" aria-hidden><DashboardIcon name="cases" /></span><div><strong>Nog geen dossiers</strong><p>Voeg een cliënt toe of start direct je eerste berekening.</p><Link className="btn" href="/cases/new">Nieuwe berekening <span aria-hidden>→</span></Link></div></div>
          ) : (
            <div className="table-wrap"><table className="table"><thead><tr><th>Dossier</th><th>Cliënt</th><th>Status</th><th>Bijgewerkt</th><th><span className="sr-only">Actie</span></th></tr></thead><tbody>{cases.map((item) => <tr key={item.id}><td><Link className="table-link" href={`/cases/${item.id}`}>{item.name}</Link></td><td>{item.client?.name || "—"}</td><td><span className={`status ${reviewClass(item.reviewStatus)}`}>{reviewLabel(item.reviewStatus)}</span></td><td>{new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "short" }).format(item.updatedAt)}</td><td><Link className="dashboard-row-link" href={`/cases/${item.id}`} aria-label={`Open dossier ${item.name}`}>→</Link></td></tr>)}</tbody></table></div>
          )}
        </section>

        <section className="panel dashboard-demo-panel">
          <div className="dashboard-demo-copy"><span className="dashboard-demo-mark" aria-hidden><DashboardIcon name="sparkles" /></span><div><div className="section-kicker">Demo-modus</div><h2 className="panel-title">Test de volledige dossierketen</h2><div className="panel-sub">Start de bestaande fictieve demo zonder echte cliëntgegevens te gebruiken.</div></div></div>
          <div className="dashboard-demo-action"><span className="status green">Fictief</span><DemoStarter /></div>
        </section>
      </div>
    </AppShell>
  );
}