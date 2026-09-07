CREATE TABLE "AppConfig" (
  "id" TEXT NOT NULL,
  "mailProvider" TEXT NOT NULL DEFAULT 'POSTMARK',
  "mailFromName" TEXT,
  "mailFromEmail" TEXT,
  "mailReplyTo" TEXT,
  "mailApiKeyCipher" TEXT,
  "mailWebhookSecretCipher" TEXT,
  "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
  "aiProvider" TEXT NOT NULL DEFAULT 'OPENAI',
  "aiModel" TEXT,
  "aiBaseUrl" TEXT,
  "aiApiKeyCipher" TEXT,
  "aiSystemPrompt" TEXT,
  "aiTemperature" DOUBLE PRECISION,
  "aiMaxTokens" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AppConfig" ("id") VALUES ('singleton') ON CONFLICT ("id") DO NOTHING;
