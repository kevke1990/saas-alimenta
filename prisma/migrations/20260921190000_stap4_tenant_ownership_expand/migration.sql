-- STAP 4 — tenant ownership, customer numbering, calculation revisions,
-- methodology identity and audit context (EXPAND phase).
--
-- Safety contract for this migration:
--   * additive only: new tables, new nullable columns, new indexes;
--   * no column is dropped, renamed or retyped;
--   * no existing migration is modified;
--   * all statements are idempotent (IF NOT EXISTS / guarded DO blocks);
--   * existing userId-based ownership stays authoritative and untouched;
--   * NOT NULL enforcement is deliberately deferred to the CONTRACT phase.
--
-- This migration contains no calculation logic. Engine and methodology code
-- (engine version 1.4.0) are not touched and remain the only authority for
-- calculation results.

-- ---------------------------------------------------------------------------
-- 1. Tenant ownership on domain records (nullable, backfilled)
-- ---------------------------------------------------------------------------

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "customerNumber" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT;
ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "currentRevision" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "revision" INTEGER;
ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "methodologyId" TEXT;
ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "normVersionId" TEXT;

ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "entityType" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "entityId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "actorRole" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "ipHash" TEXT;

-- Stable methodology identity next to the existing version string.
ALTER TABLE "NormVersion" ADD COLUMN IF NOT EXISTS "methodologyId" TEXT;
ALTER TABLE "NormVersion" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "NormVersion" ADD COLUMN IF NOT EXISTS "validationStatus" TEXT NOT NULL DEFAULT 'PROVISIONAL';

-- ---------------------------------------------------------------------------
-- 2. Foreign keys for the new ownership columns (nullable -> safe)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Client_organizationId_fkey') THEN
    ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Case_organizationId_fkey') THEN
    ALTER TABLE "Case" ADD CONSTRAINT "Case_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Calculation_organizationId_fkey') THEN
    ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Calculation_normVersionId_fkey') THEN
    ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_normVersionId_fkey"
      FOREIGN KEY ("normVersionId") REFERENCES "NormVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_organizationId_fkey') THEN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Tenant-scoped, concurrency-safe customer numbers
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "OrganizationCustomerNumberSequence" (
  "organizationId" TEXT NOT NULL,
  "lastNumber" INTEGER NOT NULL DEFAULT 100000,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationCustomerNumberSequence_pkey" PRIMARY KEY ("organizationId"),
  CONSTRAINT "OrganizationCustomerNumberSequence_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- One row per existing organization. Idempotent.
INSERT INTO "OrganizationCustomerNumberSequence" ("organizationId")
SELECT o."id" FROM "Organization" o
ON CONFLICT ("organizationId") DO NOTHING;

-- Allocation is a single atomic UPDATE ... RETURNING: the row lock serialises
-- concurrent allocations per tenant, so no two clients can receive the same
-- number and numbers are never reused.
CREATE OR REPLACE FUNCTION "allocate_customer_number"(org_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  INSERT INTO "OrganizationCustomerNumberSequence" ("organizationId")
  VALUES (org_id)
  ON CONFLICT ("organizationId") DO NOTHING;

  UPDATE "OrganizationCustomerNumberSequence"
  SET "lastNumber" = "lastNumber" + 1,
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE "organizationId" = org_id
  RETURNING "lastNumber" INTO next_number;

  IF next_number IS NULL THEN
    RAISE EXCEPTION 'Unknown organization %', org_id;
  END IF;
  IF next_number > 999999 THEN
    RAISE EXCEPTION 'Customer number range exhausted for organization %', org_id;
  END IF;

  RETURN LPAD(next_number::text, 6, '0');
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Backfill (idempotent, non-destructive)
-- ---------------------------------------------------------------------------

-- 4a. Ownership: derive the tenant from the authoritative membership table.
UPDATE "Client" c
SET "organizationId" = m."organizationId"
FROM "OrganizationMember" m
WHERE m."userId" = c."userId" AND c."organizationId" IS NULL;

UPDATE "Case" ca
SET "organizationId" = m."organizationId"
FROM "OrganizationMember" m
WHERE m."userId" = ca."userId" AND ca."organizationId" IS NULL;

UPDATE "Calculation" calc
SET "organizationId" = ca."organizationId"
FROM "Case" ca
WHERE ca."id" = calc."caseId" AND calc."organizationId" IS NULL AND ca."organizationId" IS NOT NULL;

-- 4b. Authorship: the owning user is the best available creator for legacy rows.
UPDATE "Client" SET "createdByUserId" = "userId" WHERE "createdByUserId" IS NULL;
UPDATE "Case" SET "createdByUserId" = "userId" WHERE "createdByUserId" IS NULL;

-- 4c. Customer numbers: only adopt an existing reference that already is a
-- six-digit number. Anything else is left NULL for the application to allocate.
UPDATE "Client"
SET "customerNumber" = "reference"
WHERE "customerNumber" IS NULL
  AND "reference" ~ '^[0-9]{6}$';

-- Keep each tenant sequence above every adopted number so allocation cannot collide.
UPDATE "OrganizationCustomerNumberSequence" s
SET "lastNumber" = GREATEST(s."lastNumber", x."maxNumber"),
    "updatedAt" = CURRENT_TIMESTAMP
FROM (
  SELECT "organizationId", MAX("customerNumber"::int) AS "maxNumber"
  FROM "Client"
  WHERE "organizationId" IS NOT NULL AND "customerNumber" ~ '^[0-9]{6}$'
  GROUP BY "organizationId"
) x
WHERE x."organizationId" = s."organizationId";

-- 4d. Monotonic revisions per case, derived from the existing snapshot order.
WITH ordered AS (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "caseId" ORDER BY "createdAt", "id") AS rn
  FROM "Calculation"
  WHERE "revision" IS NULL
)
UPDATE "Calculation" c
SET "revision" = ordered.rn
FROM ordered
WHERE ordered."id" = c."id";

UPDATE "Case" ca
SET "currentRevision" = COALESCE(x."maxRevision", 0)
FROM (
  SELECT "caseId", MAX("revision") AS "maxRevision"
  FROM "Calculation"
  GROUP BY "caseId"
) x
WHERE x."caseId" = ca."id" AND ca."currentRevision" = 0;

-- 4e. Methodology identity: keep the existing version string authoritative and
-- only record which methodology set it belongs to. No percentages are introduced.
UPDATE "Calculation"
SET "methodologyId" = 'tremanorm-' || REPLACE("normVersion", '.', '-')
WHERE "methodologyId" IS NULL AND "normVersion" IS NOT NULL;

UPDATE "NormVersion"
SET "methodologyId" = 'tremanorm-' || REPLACE("version", '.', '-')
WHERE "methodologyId" IS NULL;

-- ---------------------------------------------------------------------------
-- 5. Indexes and partial uniqueness (safe on nullable, backfilled data)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "Client_organizationId_status_idx" ON "Client"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "Client_organizationId_deletedAt_idx" ON "Client"("organizationId", "deletedAt");
CREATE INDEX IF NOT EXISTS "Case_organizationId_updatedAt_idx" ON "Case"("organizationId", "updatedAt");
CREATE INDEX IF NOT EXISTS "Case_organizationId_deletedAt_idx" ON "Case"("organizationId", "deletedAt");
CREATE INDEX IF NOT EXISTS "Calculation_organizationId_createdAt_idx" ON "Calculation"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "Calculation_inputHash_idx" ON "Calculation"("inputHash");
CREATE INDEX IF NOT EXISTS "Calculation_methodologyId_idx" ON "Calculation"("methodologyId");
CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "NormVersion_methodologyId_idx" ON "NormVersion"("methodologyId");

-- Partial unique indexes: they constrain only rows that already carry a value,
-- so legacy rows without a tenant or number cannot block the migration.
CREATE UNIQUE INDEX IF NOT EXISTS "Client_organizationId_customerNumber_key"
  ON "Client"("organizationId", "customerNumber")
  WHERE "organizationId" IS NOT NULL AND "customerNumber" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Calculation_caseId_revision_key"
  ON "Calculation"("caseId", "revision")
  WHERE "revision" IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6. Immutability guard for calculation snapshots
-- ---------------------------------------------------------------------------
-- Snapshots are the reproducibility anchor for reports: once written, the input,
-- result, hashes, engine version and revision must never change.

CREATE OR REPLACE FUNCTION "calculation_snapshot_is_immutable"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."inputSnapshot"::text IS DISTINCT FROM OLD."inputSnapshot"::text
     OR NEW."result"::text IS DISTINCT FROM OLD."result"::text
     OR NEW."engineVersion" IS DISTINCT FROM OLD."engineVersion"
     OR NEW."normVersion" IS DISTINCT FROM OLD."normVersion"
     OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
     OR (OLD."revision" IS NOT NULL AND NEW."revision" IS DISTINCT FROM OLD."revision")
     OR (OLD."inputHash" IS NOT NULL AND NEW."inputHash" IS DISTINCT FROM OLD."inputHash")
     OR (OLD."resultHash" IS NOT NULL AND NEW."resultHash" IS DISTINCT FROM OLD."resultHash") THEN
    RAISE EXCEPTION 'Calculation snapshots are immutable (id %)', OLD."id";
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "calculation_snapshot_immutable" ON "Calculation";
CREATE TRIGGER "calculation_snapshot_immutable"
BEFORE UPDATE ON "Calculation"
FOR EACH ROW EXECUTE FUNCTION "calculation_snapshot_is_immutable"();