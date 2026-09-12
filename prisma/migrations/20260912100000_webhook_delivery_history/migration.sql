CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lastStatusCode" INTEGER,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebhookDelivery_subscriptionId_eventId_key"
    ON "WebhookDelivery"("subscriptionId", "eventId");

CREATE INDEX "WebhookDelivery_userId_status_nextAttemptAt_idx"
    ON "WebhookDelivery"("userId", "status", "nextAttemptAt");

CREATE INDEX "WebhookDelivery_subscriptionId_createdAt_idx"
    ON "WebhookDelivery"("subscriptionId", "createdAt");

ALTER TABLE "WebhookDelivery"
    ADD CONSTRAINT "WebhookDelivery_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
