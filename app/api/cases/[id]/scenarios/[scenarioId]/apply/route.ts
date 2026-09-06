import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculationFingerprint } from '@/lib/calculation-snapshot';

export async function POST(_: Request, { params }: { params: Promise<{ id: string; scenarioId: string }> }) {
  const user = await requireUser();
  const { id, scenarioId } = await params;

  const existing = await db.case.findFirst({
    where: { id, userId: user.id, status: { not: 'ARCHIVED' } },
    include: { calculations: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!existing) return new NextResponse('Dossier niet gevonden.', { status: 404 });

  const scenario = await db.calculationScenario.findFirst({
    where: { id: scenarioId, caseId: id, userId: user.id },
  });
  if (!scenario) return new NextResponse('Scenario niet gevonden.', { status: 404 });

  const fingerprint = calculationFingerprint(scenario.inputSnapshot, 'scenario-applied', '2026.1');

  const updated = await db.$transaction(async (tx) => {
    const current = await tx.case.update({
      where: { id },
      data: {
        data: scenario.inputSnapshot,
        result: { ...(scenario.result as Record<string, unknown>), calculationFingerprint: fingerprint },
        status: 'CALCULATED',
        reviewStatus: 'INCOMPLETE',
        reviewedAt: null,
        approvedAt: null,
        approvedByUserId: null,
        calculationVersion: '2026.1',
      },
    });

    await tx.calculation.create({
      data: {
        caseId: id,
        engineVersion: 'scenario-applied',
        normVersion: '2026.1',
        inputSnapshot: scenario.inputSnapshot,
        result: { ...(scenario.result as Record<string, unknown>), calculationFingerprint: fingerprint },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'SCENARIO_APPLIED',
        metadata: {
          caseId: id,
          scenarioId,
          scenarioName: scenario.name,
          previousCalculationId: existing.calculations[0]?.id || null,
          fingerprint,
        },
      },
    });

    return current;
  });

  return NextResponse.json({ ok: true, case: updated, scenarioId });
}
