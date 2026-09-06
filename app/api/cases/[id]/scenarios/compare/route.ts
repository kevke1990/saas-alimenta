import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { compareScenarios } from '@/lib/scenario-comparison';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const url = new URL(req.url);
  const ids = [...new Set(url.searchParams.getAll('id').flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean))];

  if (ids.length < 2 || ids.length > 6) {
    return new NextResponse('Selecteer 2–6 scenario’s om te vergelijken.', { status: 422 });
  }

  const caseRecord = await db.case.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!caseRecord) return new NextResponse('Dossier niet gevonden.', { status: 404 });

  const scenarios = await db.calculationScenario.findMany({
    where: { id: { in: ids }, caseId: id, userId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  if (scenarios.length !== ids.length) {
    return new NextResponse('Een of meer scenario’s zijn niet gevonden.', { status: 404 });
  }

  return NextResponse.json({ caseId: id, scenarios: compareScenarios(scenarios) });
}
