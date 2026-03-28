-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "starred" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Notification_userId_starred_idx" ON "Notification"("userId", "starred");
