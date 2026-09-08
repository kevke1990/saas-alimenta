-- Batch C: enrich transactional mail delivery logs with event metadata.
ALTER TABLE "MailLog" ADD COLUMN "providerId" TEXT;
