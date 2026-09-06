import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { validateOverride } from '@/lib/professional-override';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: user.id } });
  if (!c) return new NextResponse('Dossier niet gevonden.', { status: 404 });
  return NextResponse.json(await db.professionalOverride.findMany({ where: { caseId: id, userId: user.id }, orderBy: { createdAt: 'desc' } }));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: user.id, status: { not: 'ARCHIVED' } } });
  if (!c) return new NextResponse('Dossier niet gevonden.', { status: 404 });
  try {
    const b = req.headers.get('content-type')?.includes('application/json') ? await req.json() : Object.fromEntries((await req.formData()).entries());
    if (b.overrideValue !== undefined) { const raw = String(b.overrideValue); b.overrideValue = raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : raw; }
    const v = validateOverride({ field: b.field, originalValue: b.originalValue, overrideValue: b.overrideValue, reason: b.reason });
    const created = await db.professionalOverride.create({ data: { caseId: id, userId: user.id, field: v.field, originalValue: v.originalValue as any, overrideValue: v.overrideValue as any, reason: v.reason } });
    await db.auditLog.create({ data: { userId: user.id, action: 'PROFESSIONAL_OVERRIDE_CREATED', metadata: { caseId: id, overrideId: created.id, field: v.field } } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) { return new NextResponse(e?.message || 'Override opslaan mislukt.', { status: 422 }); }
}
