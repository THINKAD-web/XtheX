-- CreateEnum
CREATE TYPE "AutoBidRuleStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "AutoBidRule" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "maxBudgetKrw" INTEGER NOT NULL,
    "countryCodes" JSONB NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "AutoBidRuleStatus" NOT NULL DEFAULT 'PAUSED',
    "messageTemplate" TEXT NOT NULL,
    "maxInquiriesPerRun" INTEGER NOT NULL DEFAULT 5,
    "minHoursBetweenRuns" INTEGER NOT NULL DEFAULT 6,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoBidRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoBidRun" (
    "id" UUID NOT NULL,
    "ruleId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "matchedCount" INTEGER NOT NULL,
    "createdInquiryIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoBidRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutoBidRule_userId_status_idx" ON "AutoBidRule"("userId", "status");

-- CreateIndex
CREATE INDEX "AutoBidRule_status_periodStart_periodEnd_idx" ON "AutoBidRule"("status", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "AutoBidRun_ruleId_createdAt_idx" ON "AutoBidRun"("ruleId", "createdAt");

-- CreateIndex
CREATE INDEX "AutoBidRun_userId_createdAt_idx" ON "AutoBidRun"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AutoBidRule" ADD CONSTRAINT "AutoBidRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoBidRun" ADD CONSTRAINT "AutoBidRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutoBidRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoBidRun" ADD CONSTRAINT "AutoBidRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
