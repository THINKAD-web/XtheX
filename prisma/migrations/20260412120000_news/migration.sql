-- CreateTable
CREATE TABLE "News" (
    "id" UUID NOT NULL,
    "slug" TEXT,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT,
    "link" TEXT,
    "pubDate" TIMESTAMP(3),
    "category" TEXT NOT NULL DEFAULT 'Industry News',
    "coverImage" TEXT,
    "imageUrl" TEXT,
    "source" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "News_link_key" ON "News"("link");

-- CreateIndex
CREATE INDEX "News_locale_published_createdAt_idx" ON "News"("locale", "published", "createdAt");

-- CreateIndex
CREATE INDEX "News_category_idx" ON "News"("category");
