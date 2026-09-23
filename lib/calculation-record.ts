import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { sha256 } from "./calculation-engine-v2";

export type PersistCalculationRecordInput = {
  tx: Prisma.TransactionClient;
  caseId: string;
  organizationId: string;
  userId: string;
  engineVersion: string;
  normVersion: string;
  inputSnapshot: unknown;
  result: unknown;
  inputHash: string;
};

export async function persistCalculationRecord({
  tx,
  caseId,
  organizationId,
  userId,
  engineVersion,
  normVersion,
  inputSnapshot,
  result,
  inputHash,
}: PersistCalculationRecordInput) {
  const resultHash = sha256(result);
  const revisionRows = await tx.$queryRaw<Array<{ revision: number }>>`UPDATE "Case" SET "currentRevision" = "currentRevision" + 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${caseId} AND "organizationId" = ${organizationId} AND "deletedAt" IS NULL RETURNING "currentRevision" AS revision`;
  const revision = revisionRows[0]?.revision;
  if (!revision) throw new Error("Case not found or tenant mismatch while allocating calculation revision.");
  return tx.calculation.create({
    data: {
      id: randomUUID(),
      caseId,
      organizationId,
      createdByUserId: userId,
      engineVersion,
      normVersion,
      inputSnapshot: inputSnapshot as object,
      result: result as object,
      inputHash,
      resultHash,
      revision,
    },
  });
}
