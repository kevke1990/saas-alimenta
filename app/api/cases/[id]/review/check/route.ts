import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { isCaseLockedForCalculation } from '@/lib/case-lock';
import { isProfessionalReviewSection } from '@/lib/professional-review';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = req.headers.get('content-type')?.includes('application/json') ? await req.json() : Object.fromEntries((await req.formData()).entries());
    const section = String(body.section || '');
    if (!isProfessionalReviewSection(section)) return new NextResponse('Ongeldig controleonderdeel.', { status: 422 });
    const c = await db.case.findFirst({ where: { id, userId: user.id, status: { not: 'ARCHIVED' } }, include: { calculations: { orderBy: { createdAt: 'desc' }, take: 1 } } });
    if (!c) return new NextResponse('Dossier niet gevonden.', { status: 404 });
    if (isCaseLockedForCalculation(c.reviewStatus)) return new NextResponse('Dit dossier is vergrendeld. Heropen eerst de review.', { status: 409 });
    if (!c.calculations[0]) return new NextResponse('Er is nog geen berekeningssnapshot beschikbaar.', { status: 409 });
    await db.auditLog.create({ data: { userId: user.id, action: 'CASE_REVIEW_CHECKED', metadata: { caseId: id, calculationId: c.calculations[0].id, section, checkedAt: new Date().toISOString() } } });
    return NextResponse.json({ ok: true, section, calculationId: c.calculations[0].id });
  } catch (e: any) { return new NextResponse(e?.message || 'Controleonderdeel opslaan mislukt.', { status: 400 }); }
}
