import { db } from "@/lib/db";

/** Generate a tenant-scoped six-digit customer number. */
export async function generateClientNumber(tenantOrUserId: string): Promise<string> {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = String(Math.floor(100000 + Math.random() * 900000));
    const existing = await db.client.findFirst({
      where: {
        reference: candidate,
        OR: [{ organizationId: tenantOrUserId }, { userId: tenantOrUserId }],
      },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  throw new Error("Kon geen uniek klantnummer genereren. Probeer het opnieuw.");
}
