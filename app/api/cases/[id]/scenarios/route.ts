import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculationFingerprint } from '@/lib/calculation-snapshot';
import { calculateScenario, type ScenarioChanges } from '@/lib/scenario-engine';
import type { CaseInput } from '@/lib/calculator';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: user.id }, include: { scenarios: { orderBy: { createdAt: 'desc' }, take: 30 } } });
  if (!c) return new NextResponse('Dossier niet gevonden.', { status: 404 });
  return NextResponse.json(c.scenarios);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: user.id, status: { not: 'ARCHIVED' } }, include: { calculations: { orderBy: { createdAt: 'desc' }, take: 20 } } });
  if (!c) return new NextResponse('Dossier niet gevonden.', { status: 404 });
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    if (name.length < 2 || name.length > 200) return new NextResponse('Geef een scenarionaam van 2–200 tekens.', { status: 422 });
    const changes = (body.changes || {}) as ScenarioChanges;
    const baseInput = c.data as unknown as CaseInput;
    const partnerInput = (c.metadata && typeof c.metadata === 'object' && (c.metadata as any).partnerInput) || undefined;
    const result = calculateScenario(baseInput, changes, partnerInput);
    const fingerprint = calculationFingerprint({ baseInput, changes, partnerInput }, result.engineVersion, '2026.1');
    const created = await db.calculationScenario.create({ data: {
      caseId: id, userId: user.id, name, description: body.description ? String(body.description).slice(0, 2000) : null,
      baseCalculationId: c.calculations[0]?.id || null, inputSnapshot: result.input as any, changes: changes as any, result: result as any, fingerprint
    } });
    await db.auditLog.create({ data: { userId: user.id, action: 'SCENARIO_CREATED', metadata: { caseId: id, scenarioId: created.id, fingerprint } } });
    return NextResponse.json(created);
  } catch (e: any) { return new NextResponse(e?.message || 'Scenario berekenen mislukt.', { status: 400 }); }
}
