import Link from "next/link";
import AppShell from "@/components/AppShell";
import TaskActions from "./TaskActions";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const priorityOptions = ["URGENT", "HIGH", "NORMAL", "LOW"] as const;
const priorityLabel = (value: string) => ({ URGENT: "Urgent", HIGH: "Hoog", NORMAL: "Normaal", LOW: "Laag" } as Record<string, string>)[value] || value;
const date = (value: Date) => new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(new Date(value));

type SearchParams = Promise<{ priority?: string; overdue?: string }>;

export default async function TasksPage({ searchParams }: { searchParams?: SearchParams }) {
  const user = await requireUser();
  const params = searchParams ? await searchParams : {};
  const priority = priorityOptions.includes(String(params.priority) as (typeof priorityOptions)[number]) ? String(params.priority) : "";
  const overdueOnly = params.overdue === "1";
  const now = new Date();
  const tasks = await db.task.findMany({
    where: {
      userId: user.id,
      status: "OPEN",
      ...(priority ? { priority } : {}),
      ...(overdueOnly ? { dueAt: { lt: now } } : {}),
    },
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { case: { select: { id: true, name: true } } },
  });

  return <AppShell>
    <div className="page-head">
      <div><div className="eyebrow">Werkvoorraad</div><h1 className="page-title">Open taken</h1><p className="page-subtitle">Professionele opvolging vanuit dossiers en de dagelijkse werkstroom.</p></div>
      <Link className="btn secondary" href="/work">← Werkvoorraad</Link>
    </div>
    <section className="panel topgap">
      <form method="get" className="filters" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginBottom: 18 }}>
        <label><span className="field-label">Prioriteit</span><select className="input" name="priority" defaultValue={priority}><option value="">Alle prioriteiten</option>{priorityOptions.map(value => <option key={value} value={value}>{priorityLabel(value)}</option>)}</select></label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 9 }}><input type="checkbox" name="overdue" value="1" defaultChecked={overdueOnly} /> Alleen verlopen</label>
        <button className="btn" type="submit">Filteren</button>
        {(priority || overdueOnly) && <Link className="btn secondary" href="/tasks">Reset</Link>}
      </form>
      {tasks.length === 0 ? <div className="empty">Geen open taken met deze filters.</div> : <div className="table-wrap"><table className="table"><thead><tr><th>Taak</th><th>Dossier</th><th>Prioriteit</th><th>Deadline</th><th>Actie</th></tr></thead><tbody>{tasks.map(task => <tr key={task.id}><td><strong>{task.title}</strong>{task.description && <div className="subtle">{task.description}</div>}</td><td>{task.case ? <Link className="table-link" href={`/cases/${task.case.id}`}>{task.case.name}</Link> : "—"}</td><td><span className={`status ${task.priority === "URGENT" ? "red" : task.priority === "HIGH" ? "amber" : "gray"}`}>{priorityLabel(task.priority)}</span></td><td>{task.dueAt ? date(task.dueAt) : "Geen deadline"}{task.dueAt && new Date(task.dueAt) < now && <div className="table-note">Verlopen</div>}</td><td><TaskActions taskId={task.id} /></td></tr>)}</tbody></table></div>}
    </section>
  </AppShell>;
}
