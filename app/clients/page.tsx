import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function Clients({ searchParams }: { searchParams?: SearchParams }) {
  const u = await requireUser();
  const params = searchParams ? await searchParams : {};
  const q = String(params.q || "").trim();
  const status = params.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";

  const clients = await db.client.findMany({
    where: {
      userId: u.id,
      status,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { reference: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { cases: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell>
      <div className="page-head">
        <div>
          <div className="eyebrow">Relaties</div>
          <h1 className="page-title">Cliënten</h1>
          <p className="page-subtitle">Beheer je cliënten en de bijbehorende alimentatiedossiers.</p>
        </div>
        <Link className="btn" href="/clients/new">+ Nieuwe cliënt</Link>
      </div>

      <section className="panel">
        <form method="get" className="filters" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginBottom: 18 }}>
          <label style={{ flex: "1 1 280px" }}>
            <span className="field-label">Zoeken</span>
            <input className="input" name="q" defaultValue={q} placeholder="Naam, klantnummer, e-mail of telefoon" />
          </label>
          <label style={{ flex: "0 1 180px" }}>
            <span className="field-label">Status</span>
            <select className="input" name="status" defaultValue={status}>
              <option value="ACTIVE">Actieve cliënten</option>
              <option value="ARCHIVED">Gearchiveerde cliënten</option>
            </select>
          </label>
          <button className="btn" type="submit">Zoeken</button>
          {(q || status !== "ACTIVE") && <Link className="btn secondary" href="/clients">Reset</Link>}
        </form>

        <div className="panel-head">
          <div><h2 className="panel-title">Cliëntoverzicht</h2><div className="panel-sub">{clients.length} {clients.length === 1 ? "resultaat" : "resultaten"}</div></div>
        </div>

        {clients.length === 0 ? <div className="empty">Geen cliënten gevonden met deze filters.</div> :
          <div className="table-wrap"><table className="table"><thead><tr><th>Cliënt</th><th>Klantnummer</th><th>Contact</th><th>Dossiers</th><th></th></tr></thead><tbody>
            {clients.map(c => <tr key={c.id}><td><Link className="table-link" href={`/clients/${c.id}`}>{c.name}</Link></td><td>{c.reference || "—"}</td><td>{c.email || c.phone || "—"}</td><td>{c._count.cases}</td><td><Link className="table-link" href={`/clients/${c.id}`}>Open →</Link></td></tr>)}
          </tbody></table></div>}
      </section>
    </AppShell>
  );
}
