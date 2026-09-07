import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const token = String(body?.token || "").trim();
    if (!token) return new NextResponse("Uitnodigingstoken ontbreekt.", { status: 400 });
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const invites = await db.$queryRaw<Array<{ id: string; organizationId: string; email: string; role: string }>>(Prisma.sql`SELECT "id", "organizationId", "email", "role" FROM "OrganizationInvite" WHERE "tokenHash" = ${tokenHash} AND "acceptedAt" IS NULL AND "expiresAt" > CURRENT_TIMESTAMP LIMIT 1`);
    const invite = invites[0];
    if (!invite) return new NextResponse("Uitnodiging is ongeldig of verlopen.", { status: 400 });
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) return new NextResponse("Deze uitnodiging is voor een ander e-mailadres.", { status: 403 });
    const existing = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "OrganizationMember" WHERE "userId" = ${user.id} LIMIT 1`);
    if (existing[0]) return new NextResponse("Je bent al aan een organisatie gekoppeld.", { status: 409 });
    await db.$transaction(async tx => {
      await tx.$executeRaw(Prisma.sql`INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role", "updatedAt") VALUES (${randomUUID()}, ${invite.organizationId}, ${user.id}, ${invite.role}, CURRENT_TIMESTAMP)`);
      await tx.$executeRaw(Prisma.sql`UPDATE "OrganizationInvite" SET "acceptedAt" = CURRENT_TIMESTAMP WHERE "id" = ${invite.id}`);
    });
    return NextResponse.json({ accepted: true, organizationId: invite.organizationId, role: invite.role });
  } catch (e: any) { return new NextResponse(e?.message || "Uitnodiging accepteren mislukt.", { status: 400 }); }
}
