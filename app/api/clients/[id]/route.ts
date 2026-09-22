import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientSchema } from "@/lib/validation";
import { ensureTenant } from "@/lib/tenant";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const tenant = await ensureTenant(u);
  const { id } = await params;
  const c = await db.client.findFirst({ where: { id, organizationId: tenant.id, deletedAt: null } });
  if (!c) return new NextResponse("Cliënt niet gevonden", { status: 404 });
  return NextResponse.json({ id: c.id, name: c.name, reference: c.reference || c.customerNumber, email: c.email, phone: c.phone, notes: c.notes, personAName: c.personAName, personAEmail: c.personAEmail, personAPhone: c.personAPhone, personBName: c.personBName, personBEmail: c.personBEmail, personBPhone: c.personBPhone });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const tenant = await ensureTenant(u);
  const { id } = await params;
  const current = await db.client.findFirst({ where: { id, organizationId: tenant.id, deletedAt: null } });
  if (!current) return new NextResponse("Cliënt niet gevonden", { status: 404 });
  const parsed = clientSchema.safeParse(await req.json());
  if (!parsed.success) return new NextResponse("Ongeldige cliëntgegevens", { status: 422 });
  const { reference: _ignoredReference, ...data } = parsed.data;
  const c = await db.client.update({ where: { id }, data: { ...data, reference: current.reference || current.customerNumber, customerNumber: current.customerNumber || current.reference, organizationId: tenant.id, userId: current.userId, updatedByUserId: u.id, email: data.email || null } });
  await db.auditLog.create({ data: { userId: u.id, organizationId: tenant.id, action: "CLIENT_UPDATED", entityType: "Client", entityId: c.id, actorRole: tenant.role, metadata: { clientId: c.id } } });
  return NextResponse.json(c);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const tenant = await ensureTenant(u);
  const { id } = await params;
  const current = await db.client.findFirst({ where: { id, organizationId: tenant.id, deletedAt: null }, include: { _count: { select: { cases: true } } } });
  if (!current) return new NextResponse("Cliënt niet gevonden", { status: 404 });
  if (current._count.cases > 0) return new NextResponse("Cliënt kan niet worden verwijderd zolang er dossiers aan gekoppeld zijn. Archiveer de cliënt in plaats daarvan.", { status: 409 });
  await db.$transaction(async (tx) => {
    await tx.document.deleteMany({ where: { clientId: id } });
    await tx.mailMessage.deleteMany({ where: { clientId: id } });
    await tx.calendarEvent.deleteMany({ where: { clientId: id } });
    await tx.usageEvent.deleteMany({ where: { clientId: id } });
    await tx.privacyRequest.deleteMany({ where: { clientId: id } });
    await tx.consentRecord.deleteMany({ where: { clientId: id } });
    await tx.task.deleteMany({ where: { clientId: id } });
    await tx.client.delete({ where: { id } });
    await tx.auditLog.create({ data: { userId: u.id, organizationId: tenant.id, action: "CLIENT_DELETED", entityType: "Client", entityId: id, actorRole: tenant.role, metadata: { clientId: id } } });
  });
  return NextResponse.json({ ok: true });
}
