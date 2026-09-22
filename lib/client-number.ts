import { db } from "@/lib/db";

/**
 * Allocate a tenant-scoped customer number through the database sequence.
 * The SQL function takes the row lock and guarantees that concurrent requests
 * in the same organization cannot receive the same number.
 */
export async function generateClientNumber(organizationId: string): Promise<string> {
  const rows = await db.$queryRaw<Array<{ customerNumber: string }>>`SELECT "allocate_customer_number"(${organizationId}) AS "customerNumber"`;
  const customerNumber = rows[0]?.customerNumber;
  if (!customerNumber) throw new Error("Kon geen uniek klantnummer genereren. Probeer het opnieuw.");
  return customerNumber;
}
