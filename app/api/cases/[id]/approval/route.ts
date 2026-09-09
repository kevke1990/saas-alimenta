import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { reviewCase } from '@/lib/case-review';
import { isAllowedReviewTransition, isExplicitReopen, isReviewStatus, reviewTransitionMessage } from '@/lib/review-workflow';
import { buildReviewCalculationBinding, isReviewBindingCurrent } from '@/lib/review-binding';
import { buildProfessionalReviewState } from '@/lib/professional-review';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const c = await db.case.findFirst({ where: { id, userId: user.id }, include: { documents: { select: { aiStatus: true, approvedAt: true } }, calculations: { orderBy: { createdAt: 'desc' } } } });
    if (!c) return new NextResponse('Dossier niet gevonden.', { status: 404 });
    const body = req.headers.get('content-type')?.includes('application/json') ? await req.json() : Object.fromEntries((await req.formData()).entries());
    const status = String(body.status || '');
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
    if (!isReviewStatus(status)) return new NextResponse('Ongeldige reviewstatus.', { status: 422 });
    if (comment.length > 5000) return new NextResponse('Reviewopmerking is te lang.', { status: 422 });
    if (!isAllowedReviewTransition(c.reviewStatus, status)) return new NextResponse(reviewTransitionMessage(c.reviewStatus, status), { status: 409 });

    const review = reviewCase({ data: c.data, documents: c.documents, calculations: c.calculations, result: c.result });
    const currentCalculation = c.calculations[0];
    const reviewLogs = await db.auditLog.findMany({ where: { userId: user.id, action: 'CASE_REVIEW_CHECKED', metadata: { path: ['caseId'], equals: id } }, orderBy: { createdAt: 'desc' }, take: 200 });
    const professionalReview = buildProfessionalReviewState(reviewLogs, currentCalculation?.id);

    if ((status === 'REVIEWED' || status === 'APPROVED' || status === 'FINAL') && !professionalReview.complete) {
      return new NextResponse(`Professionele review onvolledig: ${professionalReview.totalCount - professionalReview.checkedCount} controleonderdeel/onderdelen ontbreken.`, { status: 409 });
    }
    if ((status === 'APPROVED' || status === 'FINAL') && !review.readyForProfessionalReview) return new NextResponse('Goedkeuring geblokkeerd: los eerst de kritieke Case Review-punten op.', { status: 409 });
    if (status === 'FINAL' && c.reviewStatus !== 'APPROVED') return new NextResponse('Een dossier moet eerst als APPROVED zijn gemarkeerd.', { status: 409 });
    if ((status === 'APPROVED' || status === 'FINAL') && !currentCalculation) return new NextResponse('Goedkeuring geblokkeerd: er is geen berekeningssnapshot beschikbaar.', { status: 409 });

    const reopened = isExplicitReopen(c.reviewStatus, status);
    let approvalBinding: ReturnType<typeof buildReviewCalculationBinding> | null = null;
    if (status === 'APPROVED') approvalBinding = buildReviewCalculationBinding(currentCalculation!);

    if (status === 'FINAL') {
      const approvalAudit = await db.auditLog.findFirst({ where: { userId: user.id, action: 'CASE_APPROVED', metadata: { path: ['caseId'], equals: id } }, orderBy: { createdAt: 'desc' } });
      const storedBinding = approvalAudit?.metadata && typeof approvalAudit.metadata === 'object'
        ? (approvalAudit.metadata as Record<string, unknown>).calculationBinding as Partial<ReturnType<typeof buildReviewCalculationBinding>> | undefined
        : undefined;
      const currentBinding = buildReviewCalculationBinding(currentCalculation!);
      if (!isReviewBindingCurrent(storedBinding, currentBinding)) return new NextResponse('FINAL geblokkeerd: de goedgekeurde berekeningssnapshot komt niet meer overeen met de actuele berekening.', { status: 409 });
      approvalBinding = currentBinding;
    }

    const data: any = { reviewStatus: status };
    if (status === 'READY_FOR_REVIEW' || status === 'INCOMPLETE') data.reviewedAt = null;
    if (status === 'REVIEWED' || status === 'APPROVED' || status === 'FINAL') data.reviewedAt = new Date();
    if (status === 'APPROVED' || status === 'FINAL') { data.approvedAt = c.approvedAt || new Date(); data.approvedByUserId = c.approvedByUserId || user.id; }
    if (status === 'INCOMPLETE') { data.approvedAt = null; data.approvedByUserId = null; }

    const updated = await db.$transaction(async (tx) => {
      const next = await tx.case.update({ where: { id }, data });
      await tx.auditLog.create({ data: { userId: user.id, action: reopened ? 'CASE_REOPENED' : `CASE_${status}`, metadata: { caseId: id, calculationId: currentCalculation?.id || null, previousStatus: c.reviewStatus, newStatus: status, reviewScore: review.score, criticalCount: review.criticalCount, professionalReviewComplete: professionalReview.complete, explicitReopen: reopened, ...(approvalBinding ? { calculationBinding: approvalBinding } : {}) } } });
      if (comment) await tx.auditLog.create({ data: { userId: user.id, action: 'CASE_REVIEW_COMMENTED', metadata: { caseId: id, calculationId: currentCalculation?.id || null, comment } } });
      return next;
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return new NextResponse(e?.message || 'Reviewactie mislukt.', { status: 400 });
  }
}
