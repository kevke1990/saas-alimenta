import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import DeleteClientButton from "./[id]/DeleteClientButton";
import ArchiveClientButton from "./ArchiveClientButton";

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function Clients({ searchParams }: { searchParams?: SearchParams }) {
  const user = await requireUser();
  const params = searchParams ? await searchParams : {};
  const q = String(params.q || "").trim();
  const status = params.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";
  const clients = await db.client.findMany({
    where: { userId: user.id, status, ...(q ? { OR: [
      { name: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ] } : {}) },
    include: { _count: { select: { cases: true } } },
    orderBy: { name: "asc" },
  });
  const hasFilters = Boolean(q || status !== "ACTIVE");
  const emptyTitle = q ? "Geen cliënten gevonden" : status === "ARCHIVED" ? "Het archief is leeg" : "Nog geen cliënten";
  const emptyCopy = q ? "Probeer een andere naam, klantnummer, e-mailadres of telefoonnummer." : status === "ARCHIVED" ? "Gearchiveerde cliënten verschijnen hier zodra je een cliënt archiveert." : "Voeg je eerste cliënt toe om een alimentatiedossier te starten.";
  return (
    <AppShell>
      <div className="clients-page" aria-labelledby="clients-title">
        <header className="page-head clients-page-head">
          <div><div className="eyebrow">Relaties</div><h1 className="page-title" id="clients-title">Cliënten</h1><p className="page-subtitle">Beheer actieve cliënten, archief en bijbehorende alimentatiedossiers.</p></div>
          <Link className="btn clients-primary-action" href="/clients/new"><span aria-hidden="true">+</span> Nieuwe cliënt</Link>
        </header>
        <nav className="clients-status-tabs" aria-label="Cliëntstatus">
          <Link className={status === "ACTIVE" ? "active" : ""} href={q ? `/clients?q=${encodeURIComponent(q)}` : "/clients"} aria-current={status === "ACTIVE" ? "page" : undefined}>Actief</Link>
          <Link className={status === "ARCHIVED" ? "active" : ""} href={q ? `/clients?status=ARCHIVED&q=${encodeURIComponent(q)}` : "/clients?status=ARCHIVED"} aria-current={status === "ARCHIVED" ? "page" : undefined}>Archief</Link>
        </nav>
        <section className="panel clients-panel" aria-labelledby="client-overview-title">
          <form method="get" className="clients-filters" role="search">
            <input type="hidden" name="status" value={status} />
            <label className="clients-search-field"><span className="field-label">Zoeken</span><span className="clients-search-control"><span className="clients-search-icon" aria-hidden="true">⌕</span><input className="input" name="q" defaultValue={q} placeholder="Naam, klantnummer, e-mail of telefoon" /></span></label>
            <button className="btn" type="submit">Zoeken</button>
            {hasFilters ? <Link className="btn secondary" href="/clients">Wissen</Link> : null}
          </form>
          <div className="panel-head clients-panel-head"><div><div className="section-kicker">{status === "ACTIVE" ? "Actieve relaties" : "Archief"}</div><h2 className="panel-title" id="client-overview-title">Cliëntoverzicht</h2><div className="panel-sub" aria-live="polite">{clients.length} {clients.length === 1 ? "resultaat" : "resultaten"}</div></div></div>
          {clients.length === 0 ? (
            <div className="clients-empty"><span className="clients-empty-mark" aria-hidden="true">{q ? "⌕" : "◇"}</span><h3>{emptyTitle}</h3><p>{emptyCopy}</p>{q ? <Link className="btn secondary" href={status === "ARCHIVED" ? "/clients?status=ARCHIVED" : "/clients"}>Zoekopdracht wissen</Link> : status === "ACTIVE" ? <Link className="btn" href="/clients/new">Nieuwe cliënt</Link> : null}</div>
          ) : (
            <div className="table-wrap clients-table-wrap"><table className="table clients-table"><caption className="sr-only">{status === "ACTIVE" ? "Actieve cliënten" : "Gearchiveerde cliënten"}</caption><thead><tr><th scope="col">Cliënt</th><th scope="col">Klantnummer</th><th scope="col">Contact</th><th scope="col">Dossiers</th><th scope="col"><span className="sr-only">Acties</span></th></tr></thead><tbody>
              {clients.map((client) => <tr key={client.id}>
                <td data-label="Cliënt"><Link className="clients-name-link" href={`/clients/${client.id}`}>{client.name}</Link><span className={`clients-mobile-status ${client.status === "ACTIVE" ? "is-active" : ""}`}>{client.status === "ACTIVE" ? "Actief" : "Gearchiveerd"}</span></td>
                <td data-label="Klantnummer"><span className="clients-reference">{client.reference || "—"}</span></td>
                <td data-label="Contact"><span className="clients-contact">{client.email || client.phone || "Niet ingevuld"}</span></td>
                <td data-label="Dossiers"><span className="clients-case-count">{client._count.cases}</span></td>
                <td data-label="Acties"><div className="client-row-actions"><Link className="btn secondary clients-open-action" href={`/clients/${client.id}`}>Openen <span aria-hidden="true">→</span></Link><ArchiveClientButton clientId={client.id} clientName={client.name} status={client.status}/>{client._count.cases === 0 && status === "ACTIVE" ? <DeleteClientButton clientId={client.id} clientName={client.name} caseCount={client._count.cases}/> : null}</div></td>
              </tr>)}
            </tbody></table></div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
