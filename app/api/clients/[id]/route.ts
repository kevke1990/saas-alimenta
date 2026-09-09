import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientSchema } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const c = await db.client.findFirst({ where: { id, userId: u.id } });
  if (!c) return new NextResponse("Cliënt niet gevonden", { status: 404 });
  return NextResponse.json({ id: c.id, name: c.name, reference: c.reference, email: c.email, phone: c.phone, notes: c.notes, personAName: c.personAName, personAEmail: c.personAEmail, personAPhone: c.personAPhone, personBName: c.personBName, personBEmail: c.personBEmail, personBPhone: c.personBPhone });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const current = await db.client.findFirst({ where: { id, userId: u.id } });
  if (!current) return new NextResponse("Cliënt niet gevonden", { status: 404 });
  const parsed = clientSchema.safeParse(await req.json());
  if (!parsed.success) return new NextResponse("Ongeldige cliëntgegevens", { status: 422 });
  const { reference: _ignoredReference, ...data } = parsed.data;
  const c = await db.client.update({ where: { id }, data: { ...data, reference: current.reference, email: data.email || null } });
  await db.auditLog.create({ data: { userId: u.id, action: "CLIENT_UPDATED", metadata: { clientId: c.id } } });
  return NextResponse.json(c);
}
