-- CreateTable
CREATE TABLE "RecommendationDismissal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationDismissal_userId_mediaId_key" ON "RecommendationDismissal"("userId", "mediaId");

-- CreateIndex
CREATE INDEX "RecommendationDismissal_userId_createdAt_idx" ON "RecommendationDismissal"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "RecommendationDismissal" ADD CONSTRAINT "RecommendationDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationDismissal" ADD CONSTRAINT "RecommendationDismissal_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
