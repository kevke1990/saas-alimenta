import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { fingerprintCalculation, type CalculationFingerprint } from "@/lib/calculation-engine-v2";

export type ProvenanceInput = {
  sourceType: "CASE" | "DOCUMENT" | "INCOME_FACT" | "OVERRIDE" | "SCENARIO" | "MANUAL";
  sourceId?: string;
  sourceHash?: string;
  page?: number;
  label?: string;
  metadata?: Record<string, unknown>;
};

export async function recordCalculationProvenance(calculationId: string, sources: ProvenanceInput[]) {
  if (!sources.length) return;
  await db.$transaction(async tx => {
    for (const source of sources) {
      await tx.$executeRaw(Prisma.sql`INSERT INTO "CalculationProvenance" ("id", "calculationId", "sourceType", "sourceId", "sourceHash", "page", "label", "metadata") VALUES (${randomUUID()}, ${calculationId}, ${source.sourceType}, ${source.sourceId ?? null}, ${source.sourceHash ?? null}, ${source.page ?? null}, ${source.label ?? null}, ${JSON.stringify(source.metadata ?? {})}::jsonb)`);
    }
  });
}

export async function readCalculationProvenance(calculationId: string) {
  return db.$queryRaw<Array<ProvenanceInput & { id: string; calculationId: string; createdAt: Date }>>(Prisma.sql`SELECT "id", "calculationId", "sourceType", "sourceId", "sourceHash", "page", "label", "metadata", "createdAt" FROM "CalculationProvenance" WHERE "calculationId" = ${calculationId} ORDER BY "createdAt" ASC`);
}

export function buildCalculationFingerprint(input: unknown, result: unknown, normVersion: string): CalculationFingerprint {
  return fingerprintCalculation(input, result, normVersion);
}
