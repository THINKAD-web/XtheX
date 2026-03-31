-- AlterEnum
ALTER TYPE "InquiryStripePaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';
ALTER TYPE "InquiryStripePaymentStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
ALTER TYPE "AdvertiserLedgerKind" ADD VALUE 'REFUND_INQUIRY_CHECKOUT';

-- AlterTable
ALTER TABLE "InquiryStripePayment" ADD COLUMN "refundedAmountKrw" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "InquiryStripePayment" ADD COLUMN "lastStripeRefundId" TEXT;

-- AlterTable
ALTER TABLE "InquiryThreadMessage" ADD COLUMN "readAt" TIMESTAMP(3);
