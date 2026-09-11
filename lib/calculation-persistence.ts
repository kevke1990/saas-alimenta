import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { recordCalculationProvenance, type ProvenanceInput } from "./calculation-provenance";
import type { CalculationEngineV2Result } from "./calculation-pipeline-v2";

export type PersistCalculationInput = {
  caseId: string;
  userId: string;
  calculation: CalculationEngineV2Result;
  provenance?: ProvenanceInput[];
};

/** Persist a Calculation 2.0 record while the generated Prisma client is still
 * being migrated to the new provenance columns. All values are parameterised.
 */
export async function persistCalculationV2({ caseId, userId, calculation, provenance = [] }: PersistCalculationInput) {
  const id = randomUUID();
  const { fingerprint, input, result } = calculation;

  await db.$executeRaw(Prisma.sql`
    INSERT INTO "Calculation" ("id", "caseId", "engineVersion", "normVersion", "inputSnapshot", "result", "createdAt", "inputHash", "resultHash", "createdByUserId")
    VALUES (${id}, ${caseId}, ${fingerprint.engineVersion}, ${fingerprint.normVersion}, CAST(${JSON.stringify(input)} AS jsonb), CAST(${JSON.stringify(result)} AS jsonb), CURRENT_TIMESTAMP, ${fingerprint.inputHash}, ${fingerprint.resultHash}, ${userId})
  `);

  if (provenance.length) await recordCalculationProvenance(id, provenance);

  return {
    id,
    caseId,
    createdByUserId: userId,
    engineVersion: fingerprint.engineVersion,
    contractVersion: fingerprint.contractVersion,
    normVersion: fingerprint.normVersion,
    inputHash: fingerprint.inputHash,
    resultHash: fingerprint.resultHash,
  };
}
