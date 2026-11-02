import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { requireCaseTenantAccess } from '@/lib/tenant-access';
import { db } from '@/lib/db';
import { calculationFingerprint } from '@/lib/calculation-snapshot';
import { calculationLockMessage, isCaseLockedForCalculation } from '@/lib/case-lock';
import { persistCaseCalculationV2 } from '@/lib/case-calculation-v2';
import type { ProvenanceInput } from '@/lib/calculation-provenance';

export async function POST(req: Request, { params }: { params: Promise<{ id: string; scenarioId: string }> }) {
  try {
    const user = await requireUser();
    const { id, scenarioId } = await params;
    const access = await requireCaseTenantAccess(user.id, id, 'PROFESSIONAL');
    const existing = await db.case.findFirst({ where: { id, organizationId: access.organizationId, status: { not: 'ARCHIVED' } }, include: { calculations: { orderBy: { createdAt: 'desc' }, take: 1 } } });
    if (!existing) return new NextResponse('Dossier niet gevonden.', { status: 404 });
    const scenario = await db.calculationScenario.findFirst({ where: { id: scenarioId, caseId: id } });
    if (!scenario) return new NextResponse('Scenario niet gevonden.', { status: 404 });

    let body: { confirm?: boolean } = {};
    try { body = await req.json(); } catch { /* empty body is treated as unconfirmed */ }
    if (body.confirm !== true) return new NextResponse('Expliciete bevestiging vereist om een scenario definitief te maken.', { status: 422 });
    if (isCaseLockedForCalculation(existing.reviewStatus)) {
      return new NextResponse(calculationLockMessage(existing.reviewStatus), { status: 409 });
    }

    if (scenario.baseCalculationId && scenario.baseCalculationId !== existing.calculations[0]?.id) {
      return new NextResponse('Dit scenario is gebaseerd op een oudere berekening. Maak eerst een nieuw scenario op basis van de actuele berekening.', { status: 409 });
    }

    const scenarioResult = (scenario.result || {}) as Record<string, any>;
    const childPart = scenarioResult.child && typeof scenarioResult.child === 'object' ? scenarioResult.child : scenarioResult;
    const partnerPart = scenarioResult.partner ?? scenarioResult.partnerSupport ?? null;
    const engineVersion = String(childPart.engineVersion || scenarioResult.engineVersion || '2026.1');
    const normVersion = String(childPart.normVersion || scenarioResult.normVersion || '2026.1');
    const fingerprint = calculationFingerprint(scenario.inputSnapshot, engineVersion, normVersion);
    const oldResult = (existing.result || {}) as Record<string, any>;
    const resultSnapshot = {
      ...oldResult,
      ...childPart,
      combined: scenarioResult.combined ?? oldResult.combined ?? null,
      partnerSupport: partnerPart,
      scenarioAppliedId: scenarioId,
      calculationFingerprint: fingerprint,
    } as any;
    const inputSnapshot = scenario.inputSnapshot as any;
    const provenance: ProvenanceInput[] = [
      { sourceType: 'CASE', sourceId: id, label: existing.name },
      { sourceType: 'CASE', sourceId: scenarioId, label: `Scenario: ${scenario.name}` },
    ];

    const updated = await db.$transaction(async (tx) => {
      const persisted = await persistCaseCalculationV2({
        tx,
        caseId: id,
        organizationId: access.organizationId,
        userId: user.id,
        calculationInput: inputSnapshot,
        productionResult: resultSnapshot,
        normVersion,
        provenance,
      });
      const current = await tx.case.update({ where: { id }, data: {
        data: inputSnapshot,
        result: resultSnapshot,
        status: 'CALCULATED',
        reviewStatus: 'INCOMPLETE',
        reviewedAt: null,
        approvedAt: null,
        approvedByUserId: null,
        calculationVersion: normVersion,
      } });
      await tx.auditLog.create({ data: { userId: user.id, organizationId: access.organizationId, entityType: 'CASE', entityId: id, actorRole: access.role, action: 'SCENARIO_APPLIED', metadata: { caseId: id, scenarioId, scenarioName: scenario.name, previousCalculationId: existing.calculations[0]?.id || null, newCalculationId: persisted.calculationId, fingerprint, engineVersion, normVersion } } });
      return { current, calculationId: persisted.calculationId };
    });
    return NextResponse.json({ ok: true, case: updated.current, scenarioId, calculationId: updated.calculationId });
  } catch (e: any) {
    return new NextResponse(e?.message || 'Scenario toepassen mislukt.', { status: e?.message === 'UNAUTHORIZED' ? 401 : e?.status === 403 ? 403 : 400 });
  }
}
