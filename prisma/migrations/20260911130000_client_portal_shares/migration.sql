CREATE TABLE "ClientPortalShare" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastAccessedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientPortalShare_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClientPortalShare_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ClientPortalShare_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ClientPortalShare_tokenHash_key" ON "ClientPortalShare"("tokenHash");
CREATE INDEX "ClientPortalShare_caseId_createdAt_idx" ON "ClientPortalShare"("caseId", "createdAt");
CREATE INDEX "ClientPortalShare_expiresAt_idx" ON "ClientPortalShare"("expiresAt");
