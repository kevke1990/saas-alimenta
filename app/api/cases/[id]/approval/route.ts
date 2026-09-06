import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { reviewCase } from '@/lib/case-review';

const allowed = new Set(['INCOMPLETE','READY_FOR_REVIEW','REVIEWED','APPROVED','FINAL']);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const c = await db.case.findFirst({
    where: { id, userId: user.id },
    include: {
      documents: { select: { aiStatus: true, approvedAt: true } },
      calculations: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!c) return new NextResponse('Dossier niet gevonden.', { status: 404 });
  const body = req.headers.get('content-type')?.includes('application/json') ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const status = String(body.status || '');
  if (!allowed.has(status)) return new NextResponse('Ongeldige reviewstatus.', { status: 422 });

  const review = reviewCase({ data: c.data, documents: c.documents, calculations: c.calculations, result: c.result });
  if ((status === 'APPROVED' || status === 'FINAL') && !review.readyForProfessionalReview) {
    return new NextResponse('Goedkeuring geblokkeerd: los eerst de kritieke Case Review-punten op.', { status: 409 });
  }
  if (status === 'FINAL' && c.reviewStatus !== 'APPROVED' && c.approvedAt == null) {
    return new NextResponse('Een dossier moet eerst als APPROVED zijn gemarkeerd.', { status: 409 });
  }

  const data: any = { reviewStatus: status };
  if (status === 'REVIEWED' || status === 'APPROVED' || status === 'FINAL') data.reviewedAt = new Date();
  if (status === 'APPROVED' || status === 'FINAL') { data.approvedAt = c.approvedAt || new Date(); data.approvedByUserId = c.approvedByUserId || user.id; }
  if (status === 'INCOMPLETE' || status === 'READY_FOR_REVIEW' || status === 'REVIEWED') { data.approvedAt = null; data.approvedByUserId = null; }

  const updated = await db.case.update({ where: { id }, data });
  await db.auditLog.create({ data: { userId: user.id, action: `CASE_${status}`, metadata: { caseId: id, calculationId: c.calculations[0]?.id || null, reviewScore: review.score, criticalCount: review.criticalCount } } });
  return NextResponse.json(updated);
}
