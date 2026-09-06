import Link from 'next/link';
import type { Route } from 'next';
import AppShell from '@/components/AppShell';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { reviewCase } from '@/lib/case-review';
import { buildCaseWorkflow, getNextCaseWorkflowStep, workflowStatusLabel, type CaseWorkflowStatus } from '@/lib/case-workflow';

const statusClass: Record<CaseWorkflowStatus, string> = {
  INCOMPLETE: 'gray',
  READY_FOR_REVIEW: 'amber',
  REVIEWED: 'amber',
  APPROVED: 'green',
  FINAL: 'green',
};

export default async function CaseWorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({
    where: { id, userId: user.id },
    include: {
      documents: { select: { aiStatus: true, approvedAt: true } },
      calculations: { orderBy: { createdAt: 'desc' }, take: 50 },
      scenarios: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!c) return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;

  const review = reviewCase({ data: c.data, documents: c.documents, calculations: c.calculations, result: c.result });
  const rawStatus = String(c.reviewStatus || 'INCOMPLETE');
  const status: CaseWorkflowStatus = ['INCOMPLETE', 'READY_FOR_REVIEW', 'REVIEWED', 'APPROVED', 'FINAL'].includes(rawStatus)
    ? rawStatus as CaseWorkflowStatus
    : review.readyForProfessionalReview ? 'READY_FOR_REVIEW' : 'INCOMPLETE';
  const items = buildCaseWorkflow(id, {
    status,
    hasCalculation: c.calculations.length > 0,
    hasScenarios: c.scenarios.length > 0,
    hasHistory: c.calculations.length > 1,
    reviewReady: review.readyForProfessionalReview,
    reportAvailable: c.calculations.length > 0,
  });
  const next = getNextCaseWorkflowStep(items);
  const locked = status === 'APPROVED' || status === 'FINAL';

  return <AppShell>
    <div className="page-head">
      <div>
        <div className="eyebrow">Dossierworkflow</div>
        <h1 className="page-title">{c.name}</h1>
        <p className="page-subtitle">Eén overzicht van berekening tot professioneel eindrapport.</p>
      </div>
      <div className="actions">
        <span className={`status ${statusClass[status]}`}>{workflowStatusLabel(status)}</span>
        <Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link>
      </div>
    </div>

    {locked && <div className="notice success topgap"><b>Dossier vergrendeld.</b> {status === 'FINAL' ? 'Dit dossier is definitief.' : 'Dit dossier is goedgekeurd.'} Heropenen kan uitsluitend vanuit de professionele review.</div>}

    {next ? <section className="panel topgap">
      <div className="section-kicker">Volgende noodzakelijke stap</div>
      <h2 className="panel-title">{next.label}</h2>
      <p className="panel-sub">{next.description}</p>
      <div className="actions topgap"><Link className="btn" href={next.href as Route}>Ga naar {next.label} →</Link></div>
    </section> : <section className="panel topgap"><div className="section-kicker">Workflow compleet</div><h2 className="panel-title">Alle noodzakelijke stappen zijn afgerond.</h2><p className="panel-sub">Controleer het rapport en de auditinformatie voordat het dossier extern wordt gebruikt.</p></section>}

    <section className="panel topgap">
      <div className="section-kicker">Canonieke keten</div>
      <h2 className="panel-title">Berekening → Scenario’s → Historie → Review → Rapport</h2>
      <div className="detail-grid topgap">
        {items.map((item, index) => <div className="detail-card" key={item.step}>
          <div className="detail-card-head"><b>{index + 1}. {item.label}</b><span>{item.locked ? 'Vergrendeld' : item.complete ? 'Klaar' : item.active ? 'Actief' : 'Beschikbaar'}</span></div>
          <p className="panel-sub">{item.description}</p>
          <div className="actions topgap">
            <Link className="btn secondary" href={item.href as Route}>{item.locked ? 'Bekijken' : 'Openen'} →</Link>
          </div>
        </div>)}
      </div>
    </section>

    <section className="panel topgap">
      <div className="section-kicker">Controlepunten</div>
      <h2 className="panel-title">Review en audit</h2>
      <div className="audit-grid topgap">
        <div className="detail-card"><div className="summary-line"><span>Reviewscore</span><b>{review.score}/100</b></div><div className="summary-line"><span>Kritieke punten</span><b>{review.criticalCount}</b></div><div className="summary-line"><span>Waarschuwingen</span><b>{review.warningCount}</b></div></div>
        <div className="detail-card"><div className="summary-line"><span>Berekeningssnapshots</span><b>{c.calculations.length}</b></div><div className="summary-line"><span>Scenario’s</span><b>{c.scenarios.length ? 'Aanwezig' : 'Geen'}</b></div><div className="summary-line"><span>Rapport</span><b>{c.calculations.length ? 'Beschikbaar' : 'Niet beschikbaar'}</b></div></div>
      </div>
      {review.criticalCount > 0 && <div className="notice error topgap">Goedkeuring blijft geblokkeerd zolang {review.criticalCount} kritiek(e) reviewpunt(en) openstaan.</div>}
    </section>
  </AppShell>;
}
