import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewCase, type ReviewSeverity } from "@/lib/case-review";
import { buildCalculationDifference } from "@/lib/calculation-difference";
import { buildReviewCalculationBinding, isReviewBindingCurrent } from "@/lib/review-binding";

const labels: Record<ReviewSeverity, string> = { CRITICAL: "Kritiek", WARNING: "Controleren", INFO: "Aandacht", OK: "OK" };
const cls: Record<ReviewSeverity, string> = { CRITICAL: "red", WARNING: "amber", INFO: "gray", OK: "green" };
const date = (v: any) => new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v));
const money = (v: any) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(v) || 0);
const delta = (v: number) => v > 0 ? `+${money(v)}` : money(v);

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: u.id }, include: { documents: { select: { aiStatus: true, approvedAt: true } }, calculations: { orderBy: { createdAt: "desc" }, take: 2 } } });
  if (!c) return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;
  const review = reviewCase({ data: c.data, documents: c.documents, calculations: c.calculations, result: c.result });
  const current = c.calculations[0];
  const previous = c.calculations[1];
  const difference = current && previous ? buildCalculationDifference({ previous: { inputSnapshot: previous.inputSnapshot, result: previous.result, fingerprint: (previous.result as any)?.calculationFingerprint || null }, current: { inputSnapshot: current.inputSnapshot, result: current.result, fingerprint: (current.result as any)?.calculationFingerprint || null } }) : null;
  const logs = await db.auditLog.findMany({ where: { userId: u.id, action: { in: ["CASE_REVIEW_COMMENTED", "CASE_REVIEW_STARTED", "CASE_READY_FOR_REVIEW", "CASE_REVIEWED", "CASE_APPROVED", "CASE_FINAL", "CASE_REOPENED"] } }, orderBy: { createdAt: "desc" }, take: 100 });
  const history = logs.filter(x => String((x.metadata as any)?.caseId || "") === id);
  const latestApprovalAudit = history.find(x => x.action === "CASE_APPROVED");
  const approvalBinding = latestApprovalAudit?.metadata && typeof latestApprovalAudit.metadata === "object"
    ? (latestApprovalAudit.metadata as Record<string, unknown>).calculationBinding as ReturnType<typeof buildReviewCalculationBinding> | undefined
    : undefined;
  const currentBinding = current ? buildReviewCalculationBinding({ id: current.id, engineVersion: current.engineVersion, normVersion: current.normVersion, result: current.result }) : null;
  const reportProvenanceCurrent = !!currentBinding && isReviewBindingCurrent(approvalBinding, currentBinding);
  const canMarkReady = c.reviewStatus === "INCOMPLETE" && review.readyForProfessionalReview;
  const canReview = c.reviewStatus === "READY_FOR_REVIEW";
  const canApprove = c.reviewStatus === "REVIEWED";
  const canFinalise = c.reviewStatus === "APPROVED";
  const canReopen = c.reviewStatus === "APPROVED" || c.reviewStatus === "FINAL";

  return <AppShell>
    <div className="page-head"><div><div className="eyebrow">Professionele review · v1.2</div><h1 className="page-title">{c.name}</h1><p className="page-subtitle">Automatische signalering, professionele opmerkingen en gecontroleerde goedkeuring.</p></div><div className="actions"><Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link><Link className="btn secondary" href={`/cases/${id}/workflow`}>Workflow</Link><Link className="btn secondary" href={`/cases/${id}/history`}>Berekeningshistorie</Link></div></div>
    <div className="result-hero">
      <div className="stat-card result-main"><div className="stat-label">CASE REVIEW SCORE</div><div className="stat-value">{review.score}%</div><div className="stat-meta">{review.readyForProfessionalReview ? "Geen kritieke blokkade" : "Kritieke controlepunten aanwezig"}</div></div>
      <div className="stat-card"><div className="stat-label">KRITIEK</div><div className="stat-value">{review.criticalCount}</div><div className="stat-meta">Moet eerst worden opgelost</div></div>
      <div className="stat-card"><div className="stat-label">CONTROLEREN</div><div className="stat-value">{review.warningCount}</div><div className="stat-meta">Professionele beoordeling</div></div>
      <div className="stat-card"><div className="stat-label">STATUS</div><div className="stat-value" style={{fontSize: "18px"}}>{c.reviewStatus}</div><div className="stat-meta">Laatste workflowstatus</div></div>
    </div>

    {difference && <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Wijzigingen sinds vorige berekening</h2><div className="panel-sub">De review ziet nu expliciet wat financieel en inhoudelijk is veranderd tussen de twee meest recente snapshots.</div></div><Link className="btn ghost" href={`/cases/${id}/history/compare/${previous!.id}/${current!.id}`}>Volledige vergelijking</Link></div><div className="result-overview"><div className="result-metric"><div className="stat-label">KINDERALIMENTATIE</div><div className="metric-value">{delta(difference.delta.childSupport)}</div><span>verschil per maand</span></div><div className="result-metric"><div className="stat-label">PAL NETTO</div><div className="metric-value">{delta(difference.delta.partnerSupportNet)}</div><span>verschil per maand</span></div><div className="result-metric"><div className="stat-label">PAL BRUTO</div><div className="metric-value">{delta(difference.delta.partnerSupportGross)}</div><span>verschil per maand</span></div><div className="result-metric"><div className="stat-label">TOTAAL</div><div className="metric-value">{delta(difference.delta.totalPayments)}</div><span>verschil per maand</span></div></div><div className="notice topgap">{difference.inputChanges.length} gewijzigde invoerwaarde{difference.inputChanges.length === 1 ? "" : "n"}. De huidige snapshot is {difference.changed ? "inhoudelijk gewijzigd ten opzichte van de vorige snapshot" : "gelijk aan de vorige snapshot"}.</div></section>}

    <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Rapport-provenance</h2><div className="panel-sub">Het professionele rapport kan alleen als goedgekeurd worden aangemerkt wanneer de opgeslagen goedkeuringssnapshot exact overeenkomt met de actuele berekening.</div></div><Link className="btn ghost" href={`/api/cases/${id}/report`}>Open rapport</Link></div>
      <div className="result-overview">
        <div className="result-metric"><div className="stat-label">SNAPSHOT</div><div className="metric-value" style={{fontSize: "15px"}}>{current?.id || "—"}</div><span>actuele berekening</span></div>
        <div className="result-metric"><div className="stat-label">ENGINE</div><div className="metric-value" style={{fontSize: "15px"}}>{current?.engineVersion || "—"}</div><span>rekenengine</span></div>
        <div className="result-metric"><div className="stat-label">NORM</div><div className="metric-value" style={{fontSize: "15px"}}>{current?.normVersion || "—"}</div><span>normversie</span></div>
        <div className="result-metric"><div className="stat-label">STATUS</div><div className={`metric-value ${reportProvenanceCurrent ? "green" : ""}`} style={{fontSize: "15px"}}>{reportProvenanceCurrent ? "GEBONDEN" : "NIET GEBONDEN"}</div><span>{approvalBinding ? "goedkeuringssnapshot gevonden" : "nog geen goedkeuringssnapshot"}</span></div>
      </div>
      <div className={`notice topgap ${reportProvenanceCurrent ? "success" : "error"}`}>{reportProvenanceCurrent ? "De actuele berekening is exact gelijk aan de snapshot die bij APPROVED is opgeslagen. Het rapport mag deze goedkeuringsprovenance voeren." : "De actuele berekening is nog niet exact gebonden aan een APPROVED-snapshot. Het rapport wordt daarom niet als afkomstig uit een goedgekeurde snapshot gemarkeerd."}</div>
    </section>

    <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Reviewpunten</h2><div className="panel-sub">Alimenta Pro signaleert; de professional beslist.</div></div></div>
      {review.items.map(item => <div className="review-row" key={item.key}><div className="review-icon">{item.severity === "OK" ? "✓" : item.severity === "CRITICAL" ? "!" : "•"}</div><div className="review-copy"><div className="review-title"><b>{item.title}</b><span className={`status ${cls[item.severity]}`}>{labels[item.severity]}</span></div><div className="subtle">{item.detail}</div>{item.action && <div className="review-action">Volgende stap: {item.action}</div>}</div></div>)}
    </section>

    <div className="two-col topgap">
      <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Professionele workflow</h2><div className="panel-sub">De status volgt nu strikt: INCOMPLETE → READY_FOR_REVIEW → REVIEWED → APPROVED → FINAL.</div></div><span className={`status ${c.reviewStatus === "APPROVED" || c.reviewStatus === "FINAL" ? "green" : c.reviewStatus === "REVIEWED" || c.reviewStatus === "READY_FOR_REVIEW" ? "amber" : "gray"}`}>{c.reviewStatus}</span></div>
        <div className={review.readyForProfessionalReview ? "notice success" : "notice error"}>{review.readyForProfessionalReview ? "Het dossier is klaar voor professionele beoordeling." : `Los eerst ${review.criticalCount} kritisch(e) controlepunt(en) op.`}</div>
        <div className="actions topgap">
          {canMarkReady && <form action={`/api/cases/${id}/approval`} method="post"><input type="hidden" name="status" value="READY_FOR_REVIEW"/><button className="btn" type="submit">✓ Klaar voor review</button></form>}
          {canReview && <form action={`/api/cases/${id}/approval`} method="post"><input type="hidden" name="status" value="REVIEWED"/><button className="btn secondary" type="submit">Markeer als reviewed</button></form>}
          {review.readyForProfessionalReview && canApprove && <form action={`/api/cases/${id}/approval`} method="post"><input type="hidden" name="status" value="APPROVED"/><button className="btn" type="submit">✓ Goedkeuren</button></form>}
          {canFinalise && <form action={`/api/cases/${id}/approval`} method="post"><input type="hidden" name="status" value="FINAL"/><button className="btn" type="submit">Maak FINAL</button></form>}
          {canReopen && <form action={`/api/cases/${id}/approval`} method="post"><input type="hidden" name="status" value="INCOMPLETE"/><button className="btn secondary" type="submit">Heropen review</button></form>}
          <Link className="btn secondary" href={`/cases/${id}/overrides`}>Professionele overrides</Link>
        </div>
      </section>
      <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Reviewopmerking</h2><div className="panel-sub">Leg een controlebevinding of professionele toelichting vast in het auditspoor.</div></div></div>
        <form action={`/api/cases/${id}/approval`} method="post" className="topgap"><input type="hidden" name="status" value={c.reviewStatus}/><textarea name="comment" required maxLength={5000} rows={5} placeholder="Bijvoorbeeld: loonstrook gecontroleerd, woonlast onderbouwd en afwijkende kosten beoordeeld." style={{width:"100%",boxSizing:"border-box",padding:"12px",borderRadius:"10px",border:"1px solid #d9dee8",fontFamily:"inherit",resize:"vertical"}}></textarea><div className="actions topgap"><button className="btn secondary" type="submit">Opslaan in audittrail</button></div></form>
      </section>
    </div>

    <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Audittrail review</h2><div className="panel-sub">Statuswijzigingen en professionele opmerkingen blijven als afzonderlijke gebeurtenissen bewaard.</div></div></div>
      {history.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Datum</th><th>Actie</th><th>Details</th></tr></thead><tbody>{history.map(x => { const m:any=x.metadata||{}; return <tr key={x.id}><td>{date(x.createdAt)}</td><td><b>{x.action.replace(/^CASE_/, "")}</b></td><td>{m.comment || (m.reviewScore != null ? `Score ${m.reviewScore}% · ${m.criticalCount || 0} kritieke punten` : "—")}</td></tr>; })}</tbody></table></div> : <div className="empty">Nog geen reviewgebeurtenissen.</div>}
    </section>
    <div className="topgap notice">{review.disclaimer} Een APPROVED/FINAL-status is alleen beschikbaar wanneer de automatische review geen kritieke blokkade signaleert.</div>
  </AppShell>;
}
