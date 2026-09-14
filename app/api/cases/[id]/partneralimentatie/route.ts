import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculatePartnerSupport } from '@/lib/partner-engine';
import { calculatePartnerCapacity } from '@/lib/partner-capacity';
import { calculationFingerprint } from '@/lib/calculation-snapshot';

function partnerAnalysis(body: Record<string, any>) {
  const hasPartnerInput = body.partnerCapacityMode || body.partnerNetMonthlyIncome !== undefined || Array.isArray(body.partnerCareObligations);
  if (!hasPartnerInput) return undefined;

  return calculatePartnerCapacity({
    mode: body.partnerCapacityMode === 'ZERO_CAPACITY' ? 'ZERO_CAPACITY' : 'CALCULATE',
    netMonthlyIncome: Number(body.partnerNetMonthlyIncome) || 0,
    basicNeedMonthly: Number(body.partnerBasicNeedMonthly) || 0,
    otherObligationsMonthly: Number(body.partnerOtherObligationsMonthly) || 0,
    allocationPercentage: Number.isFinite(Number(body.partnerAllocationPercentage)) ? Number(body.partnerAllocationPercentage) : 100,
    careObligations: Array.isArray(body.partnerCareObligations) ? body.partnerCareObligations : [],
  });
}

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
    const partnerCapacity = partnerAnalysis(body);
    const uncoveredPartnerCare = partnerCapacity?.careObligationsMonthly
      ? Math.max(0, partnerCapacity.careObligationsMonthly - partnerCapacity.allocatedCapacityMonthly)
      : 0;
    const calculationInput = {
      ...body,
      payerOtherMaintenanceObligations: Number(body.payerOtherMaintenanceObligations || 0) + uncoveredPartnerCare,
    };
    const result = calculatePartnerSupport(calculationInput);
    const persistedResult = {
      type: 'PARTNER_SUPPORT',
      fingerprint: calculationFingerprint(calculationInput, result.engineVersion, result.normVersion),
      ...result,
      ...(partnerCapacity ? {
        partnerCapacity: {
          ...partnerCapacity,
          uncoveredCareObligationsAllocatedToOtherPerson: uncoveredPartnerCare,
          explanation: [
            ...partnerCapacity.explanation,
            uncoveredPartnerCare > 0
              ? `€${uncoveredPartnerCare.toFixed(2)} aan niet-opgevangen zorgverplichtingen is toegevoegd aan de verplichtingen van de andere persoon.`
              : 'Alle geregistreerde zorgverplichtingen zijn binnen de berekende partnercapaciteit opgevangen.',
          ],
        },
      } : {}),
    };
    const fingerprint = persistedResult.fingerprint;
    await db.calculation.create({ data: {
      caseId: id,
      engineVersion: result.engineVersion,
      normVersion: result.normVersion,
      inputSnapshot: calculationInput,
      result: persistedResult,
    }});
    await db.case.update({ where: { id }, data: { calculationVersion: result.engineVersion, metadata: { ...(typeof c.metadata === 'object' && c.metadata ? c.metadata as object : {}), partnerInput: calculationInput }, result: { ...(typeof c.result === 'object' && c.result ? c.result as object : {}), partnerSupport: persistedResult } } });
    return NextResponse.json({ ...result, ...(partnerCapacity ? { partnerCapacity: persistedResult.partnerCapacity } : {}), fingerprint });
  } catch (e: any) {
    return new NextResponse(e?.message || 'Partneralimentatie berekening mislukt.', { status: 400 });
  }
}
