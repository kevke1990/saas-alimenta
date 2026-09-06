ALTER TABLE "Client" ADD COLUMN "personAName" TEXT;
ALTER TABLE "Client" ADD COLUMN "personAEmail" TEXT;
ALTER TABLE "Client" ADD COLUMN "personAPhone" TEXT;
ALTER TABLE "Client" ADD COLUMN "personBName" TEXT;
ALTER TABLE "Client" ADD COLUMN "personBEmail" TEXT;
ALTER TABLE "Client" ADD COLUMN "personBPhone" TEXT;

-- Existing client records remain valid. They receive explicit placeholders so every
-- client has two person slots; professionals can replace these values with the names.
UPDATE "Client" SET "personAName"=COALESCE(NULLIF("personAName",''),'Persoon A'), "personBName"=COALESCE(NULLIF("personBName",''),'Persoon B') WHERE "personAName" IS NULL OR "personBName" IS NULL;
