import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const token = String(body?.token || "").trim();
    if (!token) return new NextResponse("Uitnodigingstoken ontbreekt.", { status: 400 });
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const invites = await db.$queryRaw<Array<{ id: string; organizationId: string; email: string; role: string }>>(
      Prisma.sql`SELECT "id", "organizationId", "email", "role" FROM "OrganizationInvite" WHERE "tokenHash" = ${tokenHash} AND "acceptedAt" IS NULL AND "expiresAt" > CURRENT_TIMESTAMP LIMIT 1`,
    );
    const invite = invites[0];
    if (!invite) return new NextResponse("Uitnodiging is ongeldig of verlopen.", { status: 400 });
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return new NextResponse("Deze uitnodiging is voor een ander e-mailadres.", { status: 403 });
    }

    const existing = await db.$queryRaw<Array<{ id: string; organizationId: string; memberCount: number; caseCount: number }>>(
      Prisma.sql`
        SELECT
          m."id",
          m."organizationId",
          (SELECT COUNT(*)::int FROM "OrganizationMember" m2 WHERE m2."organizationId" = m."organizationId") AS "memberCount",
          (SELECT COUNT(*)::int FROM "Case" c WHERE c."organizationId" = m."organizationId") AS "caseCount"
        FROM "OrganizationMember" m
        WHERE m."userId" = ${user.id}
        LIMIT 1
      `,
    );

    const currentMembership = existing[0];
    if (currentMembership) {
      if (currentMembership.organizationId === invite.organizationId) {
        return new NextResponse("Je bent al lid van deze organisatie.", { status: 409 });
      }
      // Block only if the user already belongs to a multi-member organization or has active cases in their current organization
      if (Number(currentMembership.memberCount) > 1 || Number(currentMembership.caseCount) > 0) {
        return new NextResponse("Je bent al aan een actieve organisatie gekoppeld.", { status: 409 });
      }
    }

    await db.$transaction(async (tx) => {
      if (currentMembership) {
        const previousOrgId = currentMembership.organizationId;
        await tx.$executeRaw(
          Prisma.sql`UPDATE "Client" SET "organizationId" = ${invite.organizationId} WHERE "organizationId" = ${previousOrgId} AND "userId" = ${user.id}`,
        );
        await tx.$executeRaw(
          Prisma.sql`UPDATE "OrganizationMember" SET "organizationId" = ${invite.organizationId}, "role" = ${invite.role}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${currentMembership.id}`,
        );
        await tx.$executeRaw(
          Prisma.sql`DELETE FROM "Organization" WHERE "id" = ${previousOrgId} AND NOT EXISTS (SELECT 1 FROM "OrganizationMember" WHERE "organizationId" = ${previousOrgId}) AND NOT EXISTS (SELECT 1 FROM "Case" WHERE "organizationId" = ${previousOrgId})`,
        );
      } else {
        await tx.$executeRaw(
          Prisma.sql`INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role", "updatedAt") VALUES (${randomUUID()}, ${invite.organizationId}, ${user.id}, ${invite.role}, CURRENT_TIMESTAMP)`,
        );
      }
      await tx.$executeRaw(Prisma.sql`UPDATE "OrganizationInvite" SET "acceptedAt" = CURRENT_TIMESTAMP WHERE "id" = ${invite.id}`);
    });
    return NextResponse.json({ accepted: true, organizationId: invite.organizationId, role: invite.role });
  } catch (e: any) {
    return new NextResponse(e?.message || "Uitnodiging accepteren mislukt.", { status: 400 });
  }
}
