import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculatePartnerSupport } from '@/lib/partner-engine';
import { calculationFingerprint } from '@/lib/calculation-snapshot';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: user.id }, include: { calculations: { orderBy: { createdAt: 'desc' }, take: 10 } } });
  if (!c) return new NextResponse('Dossier niet gevonden.', { status: 404 });
  const ka = c.calculations.find(x => x.result && typeof x.result === 'object' && (x.result as any).type !== 'PARTNER_SUPPORT');
  const rr: any = ka?.result || {};
  const suggestedChildSupport = Array.isArray(rr.transfers) ? rr.transfers.reduce((s: number, t: any) => s + Number(t.payment || 0), 0) : 0;
  return NextResponse.json({ suggestedChildSupport, latestCalculation: ka ? { id: ka.id, engineVersion: ka.engineVersion, createdAt: ka.createdAt } : null });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: user.id } });
  if (!c) return new NextResponse('Dossier niet gevonden.', { status: 404 });
  try {
    const body = await req.json();
    const result = calculatePartnerSupport(body);
    const fingerprint = calculationFingerprint(body, result.engineVersion, result.normVersion);
    await db.calculation.create({ data: {
      caseId: id,
      engineVersion: result.engineVersion,
      normVersion: result.normVersion,
      inputSnapshot: body,
      result: { type: 'PARTNER_SUPPORT', fingerprint, ...result },
    }});
    await db.case.update({ where: { id }, data: { calculationVersion: result.engineVersion, metadata: { ...(typeof c.metadata === 'object' && c.metadata ? c.metadata as object : {}), partnerInput: body }, result: { ...(typeof c.result === 'object' && c.result ? c.result as object : {}), partnerSupport: result } } });
    return NextResponse.json({ ...result, fingerprint });
  } catch (e: any) {
    return new NextResponse(e?.message || 'Partneralimentatie berekening mislukt.', { status: 400 });
  }
}
