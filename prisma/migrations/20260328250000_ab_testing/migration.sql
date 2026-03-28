-- CreateEnum
CREATE TYPE "AbExperimentStatus" AS ENUM ('DRAFT', 'RUNNING', 'STOPPED', 'CONCLUDED');

-- CreateEnum
CREATE TYPE "AbVariantKey" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "AbEventType" AS ENUM ('IMPRESSION', 'CONVERSION');

-- CreateTable
CREATE TABLE "AbExperiment" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AbExperimentStatus" NOT NULL DEFAULT 'DRAFT',
    "trafficSplitA" INTEGER NOT NULL DEFAULT 50,
    "winnerVariant" "AbVariantKey",
    "minImpressionsAuto" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbEvent" (
    "id" UUID NOT NULL,
    "experimentId" UUID NOT NULL,
    "variant" "AbVariantKey" NOT NULL,
    "type" "AbEventType" NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbExperiment_slug_key" ON "AbExperiment"("slug");

-- CreateIndex
CREATE INDEX "AbEvent_experimentId_variant_type_idx" ON "AbEvent"("experimentId", "variant", "type");

-- CreateIndex
CREATE INDEX "AbEvent_experimentId_createdAt_idx" ON "AbEvent"("experimentId", "createdAt");

-- AddForeignKey
ALTER TABLE "AbEvent" ADD CONSTRAINT "AbEvent_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "AbExperiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AbExperiment" ("id", "slug", "name", "status", "trafficSplitA", "minImpressionsAuto", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'home_hero_cta', 'Home hero CTA layout', 'RUNNING', 50, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
