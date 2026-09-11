import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const money = (v: unknown) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(v) || 0);
const date = (v: unknown) => new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(v)));

function number(v: unknown) {
  return typeof v === "number" ? v : Number(v) || 0;
}

export default async function CaseVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const dossier = await db.case.findFirst({
    where: { id, userId: user.id },
    include: { client: true, calculations: { orderBy: { createdAt: "desc" } } },
  });

  if (!dossier) return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;

  return <AppShell>
    <div className="page-head">
      <div>
        <div className="eyebrow">Dossier · versiehistorie</div>
        <h1 className="page-title">Berekeningsversies</h1>
        <p className="page-subtitle">{dossier.name} · {dossier.client?.name || "Zonder cliënt"}. Iedere opgeslagen berekening blijft gekoppeld aan zijn eigen invoersnapshot en engineversie.</p>
      </div>
      <div className="actions">
        <Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link>
      </div>
    </div>

    <section className="panel">
      <div className="panel-head">
        <div><div className="section-kicker">Audit trail</div><h2 className="panel-title">Alle opgeslagen versies</h2><div className="panel-sub">Nieuwste versie staat bovenaan. Vergelijk bedragen en technische versies voordat een rapport wordt gedeeld.</div></div>
        <span className="status gray">{dossier.calculations.length} {dossier.calculations.length === 1 ? "versie" : "versies"}</span>
      </div>

      {dossier.calculations.length === 0 ? <div className="empty-state"><h3>Nog geen opgeslagen berekening</h3><p>Voer eerst een berekening uit vanuit het dossier.</p></div> : <div className="table-wrap"><table className="table">
        <thead><tr><th>Versie</th><th>Datum</th><th>Engine</th><th>Norm</th><th>Behoefte</th><th>Draagkracht</th><th>Betaling</th></tr></thead>
        <tbody>{dossier.calculations.map((calc, index) => {
          const result = calc.result as Record<string, unknown>;
          const combined = (result?.combined || {}) as Record<string, unknown>;
          const totalNeed = number(result?.totalNeed);
          const capacity = number(result?.totalCapacity);
          const payment = number(combined.totalMonthlyPayments ?? result?.totalMonthlyPayments);
          return <tr key={calc.id}>
            <td><b>{index === 0 ? "Huidige versie" : `Versie ${dossier.calculations.length - index}`}</b><div className="table-note">ID {calc.id.slice(0, 10)}…</div></td>
            <td>{date(calc.createdAt)}</td>
            <td>{calc.engineVersion}</td>
            <td>{calc.normVersion}</td>
            <td>{money(totalNeed)}</td>
            <td>{money(capacity)}</td>
            <td><b>{money(payment)}</b></td>
          </tr>;
        })}</tbody>
      </table></div>}
    </section>

    <section className="panel topgap">
      <div className="section-kicker">Vaste auditregel</div>
      <h2 className="panel-title">Snapshots blijven leidend</h2>
      <p className="lead-copy">Een opgeslagen berekening wordt niet overschreven door latere dossierwijzigingen. De invoer en uitkomst worden als snapshot bewaard, zodat een rapport altijd naar de gebruikte berekeningsversie kan worden herleid.</p>
    </section>
  </AppShell>;
}
