-- Add recommendation-facing fields to Media
CREATE TYPE "CurrencyCode" AS ENUM ('KRW', 'USD', 'EUR', 'JPY');

ALTER TABLE "Media"
ADD COLUMN "aiMatchScore" INTEGER,
ADD COLUMN "globalCountryCode" TEXT,
ADD COLUMN "currency" "CurrencyCode" NOT NULL DEFAULT 'KRW';
