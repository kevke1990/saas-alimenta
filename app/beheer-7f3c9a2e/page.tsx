import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [users, clients, cases, logs, subs] = await Promise.all([
    db.user.count(), db.client.count(), db.case.count(), db.auditLog.findMany({orderBy:{createdAt:"desc"},take:50}), db.subscription.count()
  ]);
  return <main className="container">
    <div className="card">
      <h1>Beheer</h1><p><a className="btn" href="/beheer-7f3c9a2e/stripe">Stripe configureren</a></p>
      <p className="muted">Privé beheeromgeving · ingelogd als {admin.email}</p>
      <div className="grid topgap">
        <div className="card"><div className="muted">Gebruikers</div><div className="kpi">{users}</div></div>
        <div className="card"><div className="muted">Cliënten</div><div className="kpi">{clients}</div></div>
        <div className="card"><div className="muted">Dossiers</div><div className="kpi">{cases}</div></div>
        <div className="card"><div className="muted">Abonnementen</div><div className="kpi">{subs}</div></div>
      </div>
    </div>
    <div className="card topgap">
      <h2>Auditlog</h2>
      <table className="table"><thead><tr><th>Tijd</th><th>Actie</th><th>Gebruiker</th></tr></thead><tbody>
      {logs.map(l=><tr key={l.id}><td>{l.createdAt.toISOString()}</td><td>{l.action}</td><td>{l.userId||"system"}</td></tr>)}
      </tbody></table>
    </div>
  </main>
}
