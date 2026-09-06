ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'PROFESSIONAL';
ALTER TABLE "User" ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "mfaSecretCipher" TEXT;
ALTER TABLE "User" ADD COLUMN "passkeyEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Case" ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'INCOMPLETE';
ALTER TABLE "Case" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Case" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "Case" ADD COLUMN "approvedByUserId" TEXT;
CREATE TABLE "ProfessionalOverride" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "originalValue" JSONB,
  "overrideValue" JSONB NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfessionalOverride_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProfessionalOverride_caseId_createdAt_idx" ON "ProfessionalOverride"("caseId","createdAt");
CREATE INDEX "ProfessionalOverride_userId_createdAt_idx" ON "ProfessionalOverride"("userId","createdAt");
ALTER TABLE "ProfessionalOverride" ADD CONSTRAINT "ProfessionalOverride_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
