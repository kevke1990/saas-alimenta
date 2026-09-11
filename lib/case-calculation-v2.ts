import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { CALCULATION_CONTRACT_VERSION, CALCULATION_ENGINE_V2, fingerprintCalculation } from "./calculation-engine-v2";
import type { ProvenanceInput } from "./calculation-provenance";

export async function persistCaseCalculationV2(input: {
  tx: Prisma.TransactionClient;
  caseId: string;
  userId: string;
  calculationInput: unknown;
  productionResult: unknown;
  normVersion: string;
  provenance?: ProvenanceInput[];
}) {
  const fingerprint = fingerprintCalculation(input.calculationInput, input.productionResult, input.normVersion);
  const calculationId = randomUUID();
  await input.tx.$executeRaw(Prisma.sql`
    INSERT INTO "Calculation" ("id","caseId","engineVersion","normVersion","inputSnapshot","result","createdAt","inputHash","resultHash","createdByUserId")
    VALUES (${calculationId},${input.caseId},${CALCULATION_ENGINE_V2},${fingerprint.normVersion},CAST(${JSON.stringify(input.calculationInput)} AS jsonb),CAST(${JSON.stringify(input.productionResult)} AS jsonb),CURRENT_TIMESTAMP,${fingerprint.inputHash},${fingerprint.resultHash},${input.userId})
  `);
  for (const source of input.provenance ?? []) {
    await input.tx.$executeRaw(Prisma.sql`
      INSERT INTO "CalculationProvenance" ("id","calculationId","sourceType","sourceId","sourceHash","page","label","metadata")
      VALUES (${randomUUID()},${calculationId},${source.sourceType},${source.sourceId ?? null},${source.sourceHash ?? null},${source.page ?? null},${source.label ?? null},${JSON.stringify(source.metadata ?? {})}::jsonb)
    `);
  }
  return { calculationId, fingerprint: { ...fingerprint, engineVersion: CALCULATION_ENGINE_V2, contractVersion: CALCULATION_CONTRACT_VERSION } };
}
