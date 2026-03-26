-- Add campaign brief fields for draft creation sidebar inputs
ALTER TABLE "CampaignDraft"
ADD COLUMN "campaignPeriod" TEXT,
ADD COLUMN "totalBudgetRaw" TEXT,
ADD COLUMN "totalBudgetKrw" INTEGER;

