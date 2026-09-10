import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCalculationPdf } from "@/lib/pdf-report";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const { id } = await params;
  const record = await db.case.findFirst({
    where: { id, userId: user.id },
    include: { client: true, calculations: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!record) return NextResponse.json({ error: "Dossier niet gevonden" }, { status: 404 });
  const calculation = record.calculations[0];
  const result = (calculation?.result || record.result || {}) as Record<string, unknown>;
  const pdf = createCalculationPdf({
    title: "Alimenta Pro – Alimentatieberekening",
    clientName: record.client?.name || undefined,
    caseName: record.name,
    calculationVersion: calculation?.engineVersion || record.calculationVersion,
    normVersion: calculation?.normVersion || "2026.1",
    result,
    professionalName: user.name || user.email,
    practiceName: user.companyName || undefined,
  });
  return new NextResponse(pdf as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="alimenta-${record.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
