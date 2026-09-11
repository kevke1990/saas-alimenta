-- Major Update: calculation provenance + tenant/RBAC hardening.
-- Keep organization membership authoritative; domain records continue to use userId
-- until the later data migration that moves ownership to organizationId.

CREATE TABLE "CalculationProvenance" (
  "id" TEXT NOT NULL,
  "calculationId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "sourceHash" TEXT,
  "page" INTEGER,
  "label" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalculationProvenance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CalculationProvenance_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "Calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CalculationProvenance_calculationId_idx" ON "CalculationProvenance"("calculationId");
CREATE INDEX "CalculationProvenance_sourceType_sourceId_idx" ON "CalculationProvenance"("sourceType", "sourceId");

-- Add immutable fingerprints to Calculation without changing existing rows.
ALTER TABLE "Calculation" ADD COLUMN "inputHash" TEXT;
ALTER TABLE "Calculation" ADD COLUMN "resultHash" TEXT;
ALTER TABLE "Calculation" ADD COLUMN "createdByUserId" TEXT;

CREATE INDEX "Calculation_createdByUserId_createdAt_idx" ON "Calculation"("createdByUserId", "createdAt");

-- Backfill the creator from the owning case where possible.
UPDATE "Calculation" c
SET "createdByUserId" = ca."userId"
FROM "Case" ca
WHERE ca."id" = c."caseId" AND c."createdByUserId" IS NULL;

-- Every existing calculation must have a stable hash before new provenance-aware
-- writes are introduced. md5 is deliberately used only as a deterministic legacy
-- fingerprint; new application writes use SHA-256 in TypeScript.
UPDATE "Calculation"
SET "inputHash" = md5(CAST("inputSnapshot" AS text)),
    "resultHash" = md5(CAST("result" AS text))
WHERE "inputHash" IS NULL OR "resultHash" IS NULL;
