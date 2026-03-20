-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARTNER', 'BRAND', 'ADMIN');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('BILLBOARD', 'DIGITAL', 'TRANSIT', 'OTHER');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ANALYZING', 'ANALYZED', 'FAILED');

-- CreateEnum
CREATE TYPE "MatchingStatus" AS ENUM ('SAVED', 'INQUIRY', 'NEGOTIATION', 'CONTRACTING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MediaCategory" AS ENUM ('BILLBOARD', 'DIGITAL_BOARD', 'TRANSIT', 'STREET_FURNITURE', 'WALL', 'ETC');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL,
    "mediaName" TEXT NOT NULL,
    "category" "MediaCategory" NOT NULL,
    "description" TEXT,
    "locationJson" JSONB NOT NULL,
    "price" INTEGER,
    "cpm" INTEGER,
    "exposureJson" JSONB,
    "targetAudience" TEXT,
    "images" TEXT[],
    "tags" TEXT[],
    "pros" TEXT,
    "cons" TEXT,
    "trustScore" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "MediaStatus" NOT NULL DEFAULT 'DRAFT',
    "adminMemo" TEXT,
    "proposalFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "clerkId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARTNER',
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignDraft" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "name" TEXT,
    "channelDooh" BOOLEAN NOT NULL DEFAULT true,
    "channelWeb" BOOLEAN NOT NULL DEFAULT false,
    "channelMobile" BOOLEAN NOT NULL DEFAULT false,
    "mediaIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignEvent" (
    "id" UUID NOT NULL,
    "campaignDraftId" UUID,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "spend" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CampaignEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaProposal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "keywords" JSONB,
    "mediaTypes" JSONB,
    "summary" TEXT,
    "tone" TEXT,
    "location" JSONB NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "size" TEXT,
    "priceMin" INTEGER,
    "priceMax" INTEGER,
    "images" TEXT[],
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "reviewerId" UUID,
    "decision" "ProposalStatus" NOT NULL,
    "comment" TEXT,
    "aiScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matching" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "status" "MatchingStatus" NOT NULL DEFAULT 'SAVED',
    "desiredPeriod" TEXT,
    "budget" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matching_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" UUID NOT NULL,
    "mediaId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "budget" INTEGER,
    "message" TEXT NOT NULL,
    "locale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagCategory" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "ko" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "ja" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "ko" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "ja" TEXT,
    "categoryId" UUID NOT NULL,
    "aliases" TEXT[],
    "mappingField" TEXT NOT NULL,
    "mappingType" TEXT NOT NULL,
    "mappingValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedFilterPreset" (
    "id" UUID NOT NULL,
    "nameKo" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "filterJson" JSONB NOT NULL,
    "ownerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedFilterPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Media_status_category_idx" ON "Media"("status", "category");

-- CreateIndex
CREATE INDEX "Media_createdById_idx" ON "Media"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CampaignDraft_userId_idx" ON "CampaignDraft"("userId");

-- CreateIndex
CREATE INDEX "CampaignEvent_campaignDraftId_occurredAt_idx" ON "CampaignEvent"("campaignDraftId", "occurredAt");

-- CreateIndex
CREATE INDEX "MediaProposal_status_userId_idx" ON "MediaProposal"("status", "userId");

-- CreateIndex
CREATE INDEX "ReviewLog_proposalId_idx" ON "ReviewLog"("proposalId");

-- CreateIndex
CREATE INDEX "ReviewLog_reviewerId_idx" ON "ReviewLog"("reviewerId");

-- CreateIndex
CREATE INDEX "ReviewLog_decision_idx" ON "ReviewLog"("decision");

-- CreateIndex
CREATE INDEX "Matching_status_brandId_idx" ON "Matching"("status", "brandId");

-- CreateIndex
CREATE INDEX "Inquiry_mediaId_idx" ON "Inquiry"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "TagCategory_code_key" ON "TagCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_code_key" ON "Tag"("code");

-- CreateIndex
CREATE INDEX "Tag_categoryId_idx" ON "Tag"("categoryId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignDraft" ADD CONSTRAINT "CampaignDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaProposal" ADD CONSTRAINT "MediaProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "MediaProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matching" ADD CONSTRAINT "Matching_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matching" ADD CONSTRAINT "Matching_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "MediaProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TagCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
