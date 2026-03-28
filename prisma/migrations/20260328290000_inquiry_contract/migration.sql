-- CreateEnum
CREATE TYPE "InquiryContractStatus" AS ENUM ('DRAFT', 'AWAITING_MEDIA_OWNER', 'COMPLETED');

-- CreateTable
CREATE TABLE "InquiryContract" (
    "id" UUID NOT NULL,
    "inquiryId" UUID NOT NULL,
    "agreedBudgetKrw" INTEGER,
    "agreedPeriod" TEXT,
    "status" "InquiryContractStatus" NOT NULL DEFAULT 'DRAFT',
    "advertiserSignName" TEXT,
    "advertiserSignedAt" TIMESTAMP(3),
    "mediaOwnerSignName" TEXT,
    "mediaOwnerSignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InquiryContract_inquiryId_key" ON "InquiryContract"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryContract_status_updatedAt_idx" ON "InquiryContract"("status", "updatedAt");

-- AddForeignKey
ALTER TABLE "InquiryContract" ADD CONSTRAINT "InquiryContract_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
