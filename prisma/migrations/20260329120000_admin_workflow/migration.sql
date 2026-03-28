-- CreateEnum
CREATE TYPE "CampaignWorkflowStage" AS ENUM ('PROPOSAL', 'CONTRACT', 'LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CrmEntityType" AS ENUM ('CAMPAIGN', 'INQUIRY', 'MEDIA', 'USER', 'INVOICE');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "workflowStage" "CampaignWorkflowStage" NOT NULL DEFAULT 'PROPOSAL';

-- CreateIndex
CREATE INDEX "Campaign_workflowStage_updatedAt_idx" ON "Campaign"("workflowStage", "updatedAt");

-- AlterTable
ALTER TABLE "CampaignInvoice" ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CampaignInvoice_paidAt_idx" ON "CampaignInvoice"("paidAt");

-- CreateTable
CREATE TABLE "BroadcastSchedule" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "campaignId" UUID,
    "mediaId" UUID,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminCrmNote" (
    "id" UUID NOT NULL,
    "entityType" "CrmEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminCrmNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminTodo" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "dueAt" TIMESTAMP(3),
    "done" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assigneeId" UUID,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminTodo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BroadcastSchedule_startAt_endAt_idx" ON "BroadcastSchedule"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "BroadcastSchedule_campaignId_idx" ON "BroadcastSchedule"("campaignId");

-- CreateIndex
CREATE INDEX "BroadcastSchedule_mediaId_idx" ON "BroadcastSchedule"("mediaId");

-- CreateIndex
CREATE INDEX "AdminCrmNote_entityType_entityId_createdAt_idx" ON "AdminCrmNote"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminTodo_done_dueAt_idx" ON "AdminTodo"("done", "dueAt");

-- CreateIndex
CREATE INDEX "AdminTodo_assigneeId_idx" ON "AdminTodo"("assigneeId");

-- AddForeignKey
ALTER TABLE "BroadcastSchedule" ADD CONSTRAINT "BroadcastSchedule_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastSchedule" ADD CONSTRAINT "BroadcastSchedule_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastSchedule" ADD CONSTRAINT "BroadcastSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminCrmNote" ADD CONSTRAINT "AdminCrmNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminTodo" ADD CONSTRAINT "AdminTodo_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminTodo" ADD CONSTRAINT "AdminTodo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
