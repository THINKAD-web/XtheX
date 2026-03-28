-- CreateEnum
CREATE TYPE "CampaignInvoiceStatus" AS ENUM ('OPEN', 'PAID', 'VOID');

-- CreateTable
CREATE TABLE "CampaignInvoice" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amountKrw" INTEGER NOT NULL,
    "campaignEndAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "CampaignInvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "initialEmailSentAt" TIMESTAMP(3),
    "lastReminderAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignInvoice_campaignId_key" ON "CampaignInvoice"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignInvoice_userId_status_idx" ON "CampaignInvoice"("userId", "status");

-- CreateIndex
CREATE INDEX "CampaignInvoice_status_dueAt_idx" ON "CampaignInvoice"("status", "dueAt");

-- AddForeignKey
ALTER TABLE "CampaignInvoice" ADD CONSTRAINT "CampaignInvoice_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignInvoice" ADD CONSTRAINT "CampaignInvoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
