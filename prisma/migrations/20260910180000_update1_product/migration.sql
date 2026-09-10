ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'PRIVATE';

ALTER TABLE "User"
  ADD COLUMN "accountType" TEXT NOT NULL DEFAULT 'BUSINESS',
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "country" TEXT DEFAULT 'Nederland',
  ADD COLUMN "billingAddressLine1" TEXT,
  ADD COLUMN "billingPostalCode" TEXT,
  ADD COLUMN "billingCity" TEXT,
  ADD COLUMN "kvkNumber" TEXT,
  ADD COLUMN "vatNumber" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "practiceType" TEXT;

ALTER TABLE "Client"
  ADD COLUMN "personAGender" TEXT,
  ADD COLUMN "personBGender" TEXT;

ALTER TABLE "Document"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'OVERIG',
  ADD COLUMN "parentIndex" INTEGER,
  ADD COLUMN "childIndex" INTEGER,
  ADD COLUMN "tags" JSONB;

CREATE INDEX "Document_clientId_category_idx" ON "Document"("clientId", "category");
