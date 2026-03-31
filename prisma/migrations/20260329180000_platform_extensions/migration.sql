-- CreateEnum
CREATE TYPE "InquiryStripePaymentStatus" AS ENUM ('AWAITING_PAYMENT', 'PAID', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "AdvertiserLedgerKind" AS ENUM ('INQUIRY_CHECKOUT_PAYMENT');

-- CreateEnum
CREATE TYPE "MediaCalendarEventKind" AS ENUM ('BLOCKED', 'HOLD', 'BOOKED');

-- AlterTable
ALTER TABLE "MediaReview" ADD COLUMN "sourceInquiryId" UUID;

-- CreateTable
CREATE TABLE "InquiryStripePayment" (
    "id" UUID NOT NULL,
    "inquiryId" UUID NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "amountKrw" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'krw',
    "status" "InquiryStripePaymentStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryStripePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertiserLedgerEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "AdvertiserLedgerKind" NOT NULL,
    "amountKrw" INTEGER NOT NULL,
    "description" TEXT,
    "inquiryId" UUID,
    "inquiryStripePaymentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvertiserLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryThreadMessage" (
    "id" UUID NOT NULL,
    "inquiryId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryThreadMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaCalendarEvent" (
    "id" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "kind" "MediaCalendarEventKind" NOT NULL,
    "inquiryId" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryCompletionReview" (
    "id" UUID NOT NULL,
    "inquiryId" UUID NOT NULL,
    "advertiserId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryCompletionReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InquiryStripePayment_inquiryId_key" ON "InquiryStripePayment"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "InquiryStripePayment_stripeCheckoutSessionId_key" ON "InquiryStripePayment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "InquiryStripePayment_stripePaymentIntentId_key" ON "InquiryStripePayment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "InquiryStripePayment_status_updatedAt_idx" ON "InquiryStripePayment"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertiserLedgerEntry_inquiryStripePaymentId_key" ON "AdvertiserLedgerEntry"("inquiryStripePaymentId");

-- CreateIndex
CREATE INDEX "AdvertiserLedgerEntry_userId_createdAt_idx" ON "AdvertiserLedgerEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InquiryThreadMessage_inquiryId_createdAt_idx" ON "InquiryThreadMessage"("inquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaCalendarEvent_mediaId_startAt_idx" ON "MediaCalendarEvent"("mediaId", "startAt");

-- CreateIndex
CREATE INDEX "MediaCalendarEvent_createdById_startAt_idx" ON "MediaCalendarEvent"("createdById", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "InquiryCompletionReview_inquiryId_key" ON "InquiryCompletionReview"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryCompletionReview_mediaId_createdAt_idx" ON "InquiryCompletionReview"("mediaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaReview_sourceInquiryId_key" ON "MediaReview"("sourceInquiryId");

-- AddForeignKey
ALTER TABLE "InquiryStripePayment" ADD CONSTRAINT "InquiryStripePayment_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserLedgerEntry" ADD CONSTRAINT "AdvertiserLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserLedgerEntry" ADD CONSTRAINT "AdvertiserLedgerEntry_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserLedgerEntry" ADD CONSTRAINT "AdvertiserLedgerEntry_inquiryStripePaymentId_fkey" FOREIGN KEY ("inquiryStripePaymentId") REFERENCES "InquiryStripePayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryThreadMessage" ADD CONSTRAINT "InquiryThreadMessage_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryThreadMessage" ADD CONSTRAINT "InquiryThreadMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaCalendarEvent" ADD CONSTRAINT "MediaCalendarEvent_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaCalendarEvent" ADD CONSTRAINT "MediaCalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaCalendarEvent" ADD CONSTRAINT "MediaCalendarEvent_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryCompletionReview" ADD CONSTRAINT "InquiryCompletionReview_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryCompletionReview" ADD CONSTRAINT "InquiryCompletionReview_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryCompletionReview" ADD CONSTRAINT "InquiryCompletionReview_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaReview" ADD CONSTRAINT "MediaReview_sourceInquiryId_fkey" FOREIGN KEY ("sourceInquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
