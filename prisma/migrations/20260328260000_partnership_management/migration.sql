-- CreateEnum
CREATE TYPE "PartnershipType" AS ENUM ('MEDIA_NETWORK', 'AGENCY', 'TECH_PLATFORM', 'BRAND', 'OTHER');

-- CreateEnum
CREATE TYPE "PartnershipApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PartnershipContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateTable
CREATE TABLE "PartnershipApplication" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "type" "PartnershipType" NOT NULL,
    "message" TEXT NOT NULL,
    "submitterUserId" UUID,
    "status" "PartnershipApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "adminMemo" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" UUID,

    CONSTRAINT "PartnershipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipContract" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicationId" UUID,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "documentUrl" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "PartnershipContractStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID,

    CONSTRAINT "PartnershipContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnershipApplication_status_createdAt_idx" ON "PartnershipApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PartnershipApplication_email_idx" ON "PartnershipApplication"("email");

-- CreateIndex
CREATE INDEX "PartnershipContract_applicationId_idx" ON "PartnershipContract"("applicationId");

-- CreateIndex
CREATE INDEX "PartnershipContract_status_createdAt_idx" ON "PartnershipContract"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "PartnershipApplication" ADD CONSTRAINT "PartnershipApplication_submitterUserId_fkey" FOREIGN KEY ("submitterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipApplication" ADD CONSTRAINT "PartnershipApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipContract" ADD CONSTRAINT "PartnershipContract_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PartnershipApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipContract" ADD CONSTRAINT "PartnershipContract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
