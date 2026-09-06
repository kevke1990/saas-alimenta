import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculationFingerprint } from '@/lib/calculation-snapshot';
import { calculationLockMessage, isCaseLockedForCalculation } from '@/lib/case-lock';

export async function POST(req: Request, { params }: { params: Promise<{ id: string; scenarioId: string }> }) {
  const user = await requireUser();
  const { id, scenarioId } = await params;
  const existing = await db.case.findFirst({ where: { id, userId: user.id, status: { not: 'ARCHIVED' } }, include: { calculations: { orderBy: { createdAt: 'desc' }, take: 1 } } });
  if (!existing) return new NextResponse('Dossier niet gevonden.', { status: 404 });
  const scenario = await db.calculationScenario.findFirst({ where: { id: scenarioId, caseId: id, userId: user.id } });
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

  const scenarioResult = scenario.result as Record<string, any>;
  const engineVersion = String(scenarioResult.child?.engineVersion || scenarioResult.engineVersion || '2026.1');
  const normVersion = String(scenarioResult.child?.normVersion || scenarioResult.normVersion || '2026.1');
  const fingerprint = calculationFingerprint(scenario.inputSnapshot, engineVersion, normVersion);
  const resultSnapshot = { ...scenarioResult, calculationFingerprint: fingerprint } as any;
  const inputSnapshot = scenario.inputSnapshot as any;

  const updated = await db.$transaction(async (tx) => {
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
    const calculation = await tx.calculation.create({ data: {
      caseId: id,
      engineVersion,
      normVersion,
      inputSnapshot,
      result: resultSnapshot,
    } });
    await tx.auditLog.create({ data: { userId: user.id, action: 'SCENARIO_APPLIED', metadata: { caseId: id, scenarioId, scenarioName: scenario.name, previousCalculationId: existing.calculations[0]?.id || null, newCalculationId: calculation.id, fingerprint, engineVersion, normVersion } } });
    return { current, calculationId: calculation.id };
  });
  return NextResponse.json({ ok: true, case: updated.current, scenarioId, calculationId: updated.calculationId });
}
