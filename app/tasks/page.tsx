import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function TasksPage() {
  const user = await requireUser();
  const tasks = await db.task.findMany({
    where: { userId: user.id, status: "OPEN" },
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { case: { select: { id: true, name: true } } },
  });

  return <AppShell>
    <div className="page-head">
      <div><div className="eyebrow">Werkvoorraad</div><h1 className="page-title">Open taken</h1><p className="page-subtitle">Professionele opvolging vanuit dossiers en de dagelijkse werkstroom.</p></div>
      <Link className="btn secondary" href="/dashboard">← Dashboard</Link>
    </div>
    <section className="panel topgap">
      {tasks.length === 0 ? <div className="empty">Geen open taken. Je werkvoorraad is bijgewerkt.</div> : <div className="table-wrap"><table className="table"><thead><tr><th>Taak</th><th>Dossier</th><th>Prioriteit</th><th>Deadline</th></tr></thead><tbody>{tasks.map(task => <tr key={task.id}><td><strong>{task.title}</strong>{task.description && <div className="subtle">{task.description}</div>}</td><td>{task.case ? <Link className="table-link" href={`/cases/${task.case.id}`}>{task.case.name}</Link> : "—"}</td><td>{task.priority}</td><td>{task.dueAt ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(task.dueAt) : "Geen deadline"}</td></tr>)}</tbody></table></div>}
    </section>
  </AppShell>;
}
