import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

const allowed = new Set(['INCOMPLETE','READY_FOR_REVIEW','REVIEWED','APPROVED','FINAL']);
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: user.id } });
  if (!c) return new NextResponse('Dossier niet gevonden.', { status: 404 });
  const body = req.headers.get('content-type')?.includes('application/json') ? await req.json() : Object.fromEntries((await req.formData()).entries()); const status = String(body.status || '');
  if (!allowed.has(status)) return new NextResponse('Ongeldige reviewstatus.', { status: 422 });
  if (status === 'FINAL' && c.reviewStatus !== 'APPROVED' && c.approvedAt == null) return new NextResponse('Een dossier moet eerst als APPROVED zijn gemarkeerd.', { status: 409 });
  const data: any = { reviewStatus: status };
  if (status === 'REVIEWED' || status === 'APPROVED' || status === 'FINAL') data.reviewedAt = new Date();
  if (status === 'APPROVED' || status === 'FINAL') { data.approvedAt = c.approvedAt || new Date(); data.approvedByUserId = c.approvedByUserId || user.id; }
  const updated = await db.case.update({ where: { id }, data });
  await db.auditLog.create({ data: { userId: user.id, action: `CASE_${status}`, metadata: { caseId: id } } });
  return NextResponse.json(updated);
}
