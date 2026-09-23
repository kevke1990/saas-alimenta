ALTER TABLE "AuthSession"
  ADD COLUMN "controlMode" TEXT NOT NULL DEFAULT 'NORMAL';

CREATE INDEX "AuthSession_controlMode_idx" ON "AuthSession" ("controlMode");
