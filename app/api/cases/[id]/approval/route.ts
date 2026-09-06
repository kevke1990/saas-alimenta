import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { reviewCase } from '@/lib/case-review';
import { isAllowedReviewTransition, isExplicitReopen, isReviewStatus, reviewTransitionMessage } from '@/lib/review-workflow';

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
    if ((status === 'APPROVED' || status === 'FINAL') && !review.readyForProfessionalReview) return new NextResponse('Goedkeuring geblokkeerd: los eerst de kritieke Case Review-punten op.', { status: 409 });
    if (status === 'FINAL' && c.reviewStatus !== 'APPROVED') return new NextResponse('Een dossier moet eerst als APPROVED zijn gemarkeerd.', { status: 409 });

    const reopened = isExplicitReopen(c.reviewStatus, status);
    const data: any = { reviewStatus: status };
    if (status === 'READY_FOR_REVIEW' || status === 'INCOMPLETE') data.reviewedAt = null;
    if (status === 'REVIEWED' || status === 'APPROVED' || status === 'FINAL') data.reviewedAt = new Date();
    if (status === 'APPROVED' || status === 'FINAL') { data.approvedAt = c.approvedAt || new Date(); data.approvedByUserId = c.approvedByUserId || user.id; }
    if (status === 'INCOMPLETE') { data.approvedAt = null; data.approvedByUserId = null; }

    const updated = await db.$transaction(async (tx) => {
      const next = await tx.case.update({ where: { id }, data });
      await tx.auditLog.create({ data: { userId: user.id, action: reopened ? 'CASE_REOPENED' : `CASE_${status}`, metadata: { caseId: id, calculationId: c.calculations[0]?.id || null, previousStatus: c.reviewStatus, newStatus: status, reviewScore: review.score, criticalCount: review.criticalCount, explicitReopen: reopened } } });
      if (comment) await tx.auditLog.create({ data: { userId: user.id, action: 'CASE_REVIEW_COMMENTED', metadata: { caseId: id, calculationId: c.calculations[0]?.id || null, comment } } });
      return next;
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return new NextResponse(e?.message || 'Reviewactie mislukt.', { status: 400 });
  }
}
