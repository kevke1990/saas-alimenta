import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const fmt = (v: Date) => new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v));

export default async function CaseCommunicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: user.id }, include: { client: true } });
  if (!c) return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;
  const messages = await db.mailMessage.findMany({
    where: { userId: user.id, caseId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const drafts = messages.filter(m => m.status === "DRAFT");
  const sent = messages.filter(m => m.status === "SENT");

  return <AppShell><main className="content" style={{ maxWidth: 1180 }}>
    <div className="page-head"><div><div className="eyebrow">Dossier · communicatie</div><h1 className="page-title">Communicatie</h1><p className="page-subtitle">{c.name} · {c.client?.name || "Zonder cliënt"}</p></div><div className="actions"><Link className="btn secondary" href={`/cases/${id}/workspace`}>← Werkblad</Link><Link className="btn" href="/mail">E-mail openen</Link></div></div>
    <section className="result-overview"><div className="result-primary"><div className="stat-label">BERICHTEN</div><div className="result-amount">{messages.length}</div><div className="stat-meta">Gekoppeld aan dit dossier</div></div><div className="result-metric"><div className="stat-label">CONCEPTEN</div><div className="metric-value">{drafts.length}</div><span>handmatig verzenden</span></div><div className="result-metric"><div className="stat-label">VERZONDEN</div><div className="metric-value">{sent.length}</div><span>geregistreerd</span></div></section>
    <section className="panel topgap"><div className="panel-head"><div><div className="section-kicker">Dossierhistorie</div><h2 className="panel-title">E-mailberichten</h2><div className="panel-sub">Concepten blijven reviewbaar; verzenden vereist altijd een expliciete actie.</div></div></div>
      {messages.length===0?<div className="notice topgap">Nog geen e-mail gekoppeld aan dit dossier.</div>:<div className="stack topgap">{messages.map(m=><article key={m.id} className="detail-card"><div className="detail-card-head"><b>{m.subject || "Zonder onderwerp"}</b><span>{m.status === "DRAFT" ? "Concept" : "Verzonden"}</span></div><p className="subtle">{m.direction === "OUTBOUND" ? `Aan: ${Array.isArray(m.toEmails) ? m.toEmails.join(", ") : "onbekend"}` : `Van: ${m.fromEmail}`}</p><p className="subtle">{fmt(m.createdAt)}</p>{m.textBody&&<p style={{whiteSpace:"pre-wrap"}}>{m.textBody}</p>}{m.status === "DRAFT"&&<Link className="btn secondary" href="/mail">Concept beheren</Link>}</article>)}</div>}
    </section>
  </main></AppShell>;
}
