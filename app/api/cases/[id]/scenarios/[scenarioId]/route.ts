import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; scenarioId: string }> }) {
  const u = await requireUser(); const { id, scenarioId } = await params;
  const s = await db.calculationScenario.findFirst({ where: { id: scenarioId, caseId: id, userId: u.id } });
  if (!s) return new NextResponse('Scenario niet gevonden.', { status: 404 });
  await db.calculationScenario.delete({ where: { id: scenarioId } });
  await db.auditLog.create({ data: { userId: u.id, action: 'SCENARIO_DELETED', metadata: { caseId: id, scenarioId } } });
  return NextResponse.json({ ok: true });
}
