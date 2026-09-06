import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewCase, type ReviewSeverity } from "@/lib/case-review";

const labels: Record<ReviewSeverity, string> = { CRITICAL: "Kritiek", WARNING: "Controleren", INFO: "Aandacht", OK: "OK" };
const cls: Record<ReviewSeverity, string> = { CRITICAL: "red", WARNING: "amber", INFO: "gray", OK: "green" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: u.id }, include: { documents: { select: { aiStatus: true, approvedAt: true } }, calculations: { orderBy: { createdAt: "desc" } } } });
  if (!c) return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;
  const review = reviewCase({ data: c.data, documents: c.documents, calculations: c.calculations, result: c.result });
  return <AppShell>
    <div className="page-head"><div><div className="eyebrow">Case Review · v1.3.1</div><h1 className="page-title">{c.name}</h1><p className="page-subtitle">Automatische dossiercontrole vóór professionele beoordeling.</p></div><div className="actions"><Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link><Link className="btn secondary" href={`/cases/${id}/intelligence`}>Dossier Health</Link></div></div>
    <div className="result-hero">
      <div className="stat-card result-main"><div className="stat-label">CASE REVIEW SCORE</div><div className="stat-value">{review.score}%</div><div className="stat-meta">{review.readyForProfessionalReview ? "Geen kritieke blokkade" : "Kritieke controlepunten aanwezig"}</div></div>
      <div className="stat-card"><div className="stat-label">KRITIEK</div><div className="stat-value">{review.criticalCount}</div><div className="stat-meta">Moet eerst worden opgelost</div></div>
      <div className="stat-card"><div className="stat-label">CONTROLEREN</div><div className="stat-value">{review.warningCount}</div><div className="stat-meta">Professionele review</div></div>
      <div className="stat-card"><div className="stat-label">AANDACHT</div><div className="stat-value">{review.infoCount}</div><div className="stat-meta">Niet blokkerend</div></div>
    </div>
    <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Reviewpunten</h2><div className="panel-sub">Alimenta Pro signaleert; de professional beslist.</div></div></div>
      {review.items.map(item => <div className="review-row" key={item.key}><div className="review-icon">{item.severity === "OK" ? "✓" : item.severity === "CRITICAL" ? "!" : "•"}</div><div className="review-copy"><div className="review-title"><b>{item.title}</b><span className={`status ${cls[item.severity]}`}>{labels[item.severity]}</span></div><div className="subtle">{item.detail}</div>{item.action && <div className="review-action">Volgende stap: {item.action}</div>}</div></div>)}
    </section>
    <div className="two-col topgap"><section className="panel"><div className="panel-head"><div><h2 className="panel-title">Prioriteit</h2><div className="panel-sub">Een kritisch punt markeert dat professionele controle noodzakelijk is.</div></div></div><div className={review.readyForProfessionalReview ? "notice success" : "notice error"}>{review.readyForProfessionalReview ? "Het dossier heeft geen kritieke Case Review-blokkade." : `Los eerst ${review.criticalCount} kritisch(e) controlepunt(en) op.`}</div></section><aside className="panel"><h2 className="panel-title">Methodiek</h2><p className="subtle topgap">Deterministische signalering op basis van dossierdata, documentstatus en laatste berekening. Geen automatische juridische conclusie.</p></aside></div>
    <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Professionele workflow</h2><div className="panel-sub">Statussen worden geaudit opgeslagen. Een finale status vereist eerst APPROVED.</div></div><span className="status green">{c.reviewStatus}</span></div><div className="actions topgap">{review.readyForProfessionalReview && <form action={`/api/cases/${id}/approval`} method="post"><input type="hidden" name="status" value="REVIEWED"/><button className="btn secondary" type="submit">Markeer als reviewed</button></form>}<form action={`/api/cases/${id}/approval`} method="post"><input type="hidden" name="status" value="APPROVED"/><button className="btn" type="submit">✓ Goedkeuren</button></form>{c.reviewStatus==='APPROVED' && <form action={`/api/cases/${id}/approval`} method="post"><input type="hidden" name="status" value="FINAL"/><button className="btn" type="submit">Maak FINAL</button></form>}<Link className="btn secondary" href={`/cases/${id}/overrides`}>Professionele overrides</Link></div></section>
    <div className="topgap notice">{review.disclaimer}</div>
  </AppShell>;
}
