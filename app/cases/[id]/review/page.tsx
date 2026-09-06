import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewCase, type ReviewSeverity } from "@/lib/case-review";

const labels: Record<ReviewSeverity, string> = { CRITICAL: "Kritiek", WARNING: "Controleren", INFO: "Aandacht", OK: "OK" };
const cls: Record<ReviewSeverity, string> = { CRITICAL: "red", WARNING: "amber", INFO: "gray", OK: "green" };
const date = (v: any) => new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v));

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: u.id }, include: { documents: { select: { aiStatus: true, approvedAt: true } }, calculations: { orderBy: { createdAt: "desc" } } } });
  if (!c) return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;
  const review = reviewCase({ data: c.data, documents: c.documents, calculations: c.calculations, result: c.result });
  const logs = await db.auditLog.findMany({ where: { userId: u.id, action: { in: ["CASE_REVIEW_COMMENTED", "CASE_REVIEW_STARTED", "CASE_REVIEWED", "CASE_APPROVED", "CASE_FINAL", "CASE_REOPENED"] } }, orderBy: { createdAt: "desc" }, take: 100 });
  const history = logs.filter(x => String((x.metadata as any)?.caseId || "") === id);
  const canReview = c.reviewStatus === "INCOMPLETE" || c.reviewStatus === "READY_FOR_REVIEW";
  const canApprove = c.reviewStatus === "REVIEWED";
  const canFinalise = c.reviewStatus === "APPROVED";
  const canReopen = c.reviewStatus === "APPROVED" || c.reviewStatus === "FINAL";

  return <AppShell>
    <div className="page-head"><div><div className="eyebrow">Professionele review · v1.1</div><h1 className="page-title">{c.name}</h1><p className="page-subtitle">Automatische signalering, professionele opmerkingen en gecontroleerde goedkeuring.</p></div><div className="actions"><Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link><Link className="btn secondary" href={`/cases/${id}/workflow`}>Workflow</Link><Link className="btn secondary" href={`/cases/${id}/history`}>Berekeningshistorie</Link></div></div>
    <div className="result-hero">
      <div className="stat-card result-main"><div className="stat-label">CASE REVIEW SCORE</div><div className="stat-value">{review.score}%</div><div className="stat-meta">{review.readyForProfessionalReview ? "Geen kritieke blokkade" : "Kritieke controlepunten aanwezig"}</div></div>
      <div className="stat-card"><div className="stat-label">KRITIEK</div><div className="stat-value">{review.criticalCount}</div><div className="stat-meta">Moet eerst worden opgelost</div></div>
      <div className="stat-card"><div className="stat-label">CONTROLEREN</div><div className="stat-value">{review.warningCount}</div><div className="stat-meta">Professionele beoordeling</div></div>
      <div className="stat-card"><div className="stat-label">STATUS</div><div className="stat-value" style={{fontSize: "18px"}}>{c.reviewStatus}</div><div className="stat-meta">Laatste workflowstatus</div></div>
    </div>

    <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Reviewpunten</h2><div className="panel-sub">Alimenta Pro signaleert; de professional beslist.</div></div></div>
      {review.items.map(item => <div className="review-row" key={item.key}><div className="review-icon">{item.severity === "OK" ? "✓" : item.severity === "CRITICAL" ? "!" : "•"}</div><div className="review-copy"><div className="review-title"><b>{item.title}</b><span className={`status ${cls[item.severity]}`}>{labels[item.severity]}</span></div><div className="subtle">{item.detail}</div>{item.action && <div className="review-action">Volgende stap: {item.action}</div>}</div></div>)}
    </section>

    <div className="two-col topgap">
      <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Professionele workflow</h2><div className="panel-sub">De status volgt nu strikt: INCOMPLETE → READY_FOR_REVIEW → REVIEWED → APPROVED → FINAL.</div></div><span className={`status ${c.reviewStatus === "APPROVED" || c.reviewStatus === "FINAL" ? "green" : c.reviewStatus === "REVIEWED" || c.reviewStatus === "READY_FOR_REVIEW" ? "amber" : "gray"}`}>{c.reviewStatus}</span></div>
        <div className={review.readyForProfessionalReview ? "notice success" : "notice error"}>{review.readyForProfessionalReview ? "Het dossier is klaar voor professionele beoordeling." : `Los eerst ${review.criticalCount} kritisch(e) controlepunt(en) op.`}</div>
        <div className="actions topgap">
          {review.readyForProfessionalReview && canReview && <form action={`/api/cases/${id}/approval`} method="post"><input type="hidden" name="status" value="REVIEWED"/><button className="btn secondary" type="submit">Markeer als reviewed</button></form>}
          {review.readyForProfessionalReview && canApprove && <form action={`/api/cases/${id}/approval`} method="post"><input type="hidden" name="status" value="APPROVED"/><button className="btn" type="submit">✓ Goedkeuren</button></form>}
          {canFinalise && <form action={`/api/cases/${id}/approval`} method="post"><input type="hidden" name="status" value="FINAL"/><button className="btn" type="submit">Maak FINAL</button></form>}
          {canReopen && <form action={`/api/cases/${id}/approval`} method="post"><input type="hidden" name="status" value="INCOMPLETE"/><button className="btn secondary" type="submit">Heropen review</button></form>}
          <Link className="btn secondary" href={`/cases/${id}/overrides`}>Professionele overrides</Link>
        </div>
      </section>
      <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Reviewopmerking</h2><div className="panel-sub">Leg een controlebevinding of professionele toelichting vast in het auditspoor.</div></div></div>
        <form action={`/api/cases/${id}/approval`} method="post" className="topgap"><input type="hidden" name="status" value={c.reviewStatus === "APPROVED" || c.reviewStatus === "FINAL" ? "APPROVED" : "REVIEWED"}/><textarea name="comment" required maxLength={5000} rows={5} placeholder="Bijvoorbeeld: loonstrook gecontroleerd, woonlast onderbouwd en afwijkende kosten beoordeeld." style={{width:"100%",boxSizing:"border-box",padding:"12px",borderRadius:"10px",border:"1px solid #d9dee8",fontFamily:"inherit",resize:"vertical"}}></textarea><div className="actions topgap"><button className="btn secondary" type="submit">Opslaan in audittrail</button></div></form>
      </section>
    </div>

    <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Audittrail review</h2><div className="panel-sub">Statuswijzigingen en professionele opmerkingen blijven als afzonderlijke gebeurtenissen bewaard.</div></div></div>
      {history.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Datum</th><th>Actie</th><th>Details</th></tr></thead><tbody>{history.map(x => { const m:any=x.metadata||{}; return <tr key={x.id}><td>{date(x.createdAt)}</td><td><b>{x.action.replace(/^CASE_/, "")}</b></td><td>{m.comment || (m.reviewScore != null ? `Score ${m.reviewScore}% · ${m.criticalCount || 0} kritieke punten` : "—")}</td></tr>; })}</tbody></table></div> : <div className="empty">Nog geen reviewgebeurtenissen.</div>}
    </section>
    <div className="topgap notice">{review.disclaimer} Een APPROVED/FINAL-status is alleen beschikbaar wanneer de automatische review geen kritieke blokkade signaleert.</div>
  </AppShell>;
}
