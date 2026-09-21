import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculatePartnerSupport } from '@/lib/partner-engine';
import { calculatePartnerCapacity } from '@/lib/partner-capacity';
import { persistCaseCalculationV2 } from '@/lib/case-calculation-v2';
import type { ProvenanceInput } from '@/lib/calculation-provenance';
import { resolveChildCostShareFromCaseResult } from '@/lib/combined-case-support';

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

function latestChildCostShare(
  calculations: Array<{ result: unknown }>,
  payerIndex: 0 | 1,
  manualOverride: unknown,
) {
  const latest = calculations.find(x => {
    const result = x.result as any;
    return result && typeof result === 'object' && result.type !== 'PARTNER_SUPPORT';
  });
  if (!latest) return null;

  return resolveChildCostShareFromCaseResult(latest.result, payerIndex, manualOverride);
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({
    where: { id, userId: user.id },
    include: { calculations: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });
  if (!c) return new NextResponse('Dossier niet gevonden.', { status: 404 });

  const ka = c.calculations.find(x => x.result && typeof x.result === 'object' && (x.result as any).type !== 'PARTNER_SUPPORT');
  const rr: any = ka?.result || {};
  const suggestedChildSupport = rr.combined?.childSupportByParent
    ? rr.combined.childSupportByParent.reduce((s: number, value: unknown) => s + Number(value || 0), 0)
    : Array.isArray(rr.transfers)
      ? rr.transfers.reduce((s: number, t: any) => s + Number(t.payment || 0), 0)
      : 0;
  const childCostShareByParent = rr.combined?.childCostShareByParent ?? null;

  return NextResponse.json({
    suggestedChildSupport,
    childCostShareByParent,
    latestCalculation: ka ? { id: ka.id, engineVersion: ka.engineVersion, createdAt: ka.createdAt } : null,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({
    where: { id, userId: user.id },
    include: { calculations: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });
  if (!c) return new NextResponse('Dossier niet gevonden.', { status: 404 });

  try {
    const body = await req.json();
    const partnerCapacity = partnerAnalysis(body);
    const uncoveredPartnerCare = partnerCapacity?.careObligationsMonthly
      ? Math.max(0, partnerCapacity.careObligationsMonthly - partnerCapacity.allocatedCapacityMonthly)
      : 0;

    const payerIndexValue = Number(body.payerIndex);
    const payerIndex: 0 | 1 | null = payerIndexValue === 0 || payerIndexValue === 1 ? payerIndexValue : null;
    const manualChildSupport = body.currentChildSupport;
    const resolvedChildCostShare = payerIndex === null
      ? null
      : latestChildCostShare(c.calculations, payerIndex, manualChildSupport);

    const calculationInput = {
      ...body,
      ...(resolvedChildCostShare
        ? {
            currentChildSupport: resolvedChildCostShare.childCostShare,
            childCostShareSource: resolvedChildCostShare.source,
          }
        : {}),
      payerOtherMaintenanceObligations: Number(body.payerOtherMaintenanceObligations || 0) + uncoveredPartnerCare,
    };

    const result = calculatePartnerSupport(calculationInput);
    const persistedResult = {
      type: 'PARTNER_SUPPORT',
            ...result,
      ...(resolvedChildCostShare ? {
        childCostShare: resolvedChildCostShare.childCostShare,
        childCostShareSource: resolvedChildCostShare.source,
      } : {}),
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
    const provenance: ProvenanceInput[] = [
      { sourceType: 'CASE', sourceId: id, label: c.name },
    ];
    const persisted = await db.$transaction(async tx => {
      const snapshot = await persistCaseCalculationV2({
        tx,
        caseId: id,
        userId: user.id,
        calculationInput,
        productionResult: persistedResult,
        normVersion: result.normVersion,
        provenance,
      });

      await tx.case.update({
        where: { id },
        data: {
          calculationVersion: result.engineVersion,
          metadata: {
            ...(typeof c.metadata === 'object' && c.metadata ? c.metadata as object : {}),
            partnerInput: calculationInput,
          },
          result: {
            ...(typeof c.result === 'object' && c.result ? c.result as object : {}),
            partnerSupport: persistedResult,
          },
        },
      });
      return snapshot;
    });
    const fingerprint = persisted.fingerprint;

    return NextResponse.json({
      ...result,
      ...(resolvedChildCostShare ? {
        childCostShare: resolvedChildCostShare.childCostShare,
        childCostShareSource: resolvedChildCostShare.source,
      } : {}),
      ...(partnerCapacity ? { partnerCapacity: persistedResult.partnerCapacity } : {}),
      fingerprint,
    });
  } catch (e: any) {
    return new NextResponse(e?.message || 'Partneralimentatie berekening mislukt.', { status: 400 });
  }
}
