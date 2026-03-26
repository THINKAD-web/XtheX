-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN IF NOT EXISTS "durationWeeks" INTEGER;
ALTER TABLE "Inquiry" ADD COLUMN IF NOT EXISTS "inquirerUserId" UUID;

CREATE INDEX IF NOT EXISTS "Inquiry_inquirerUserId_idx" ON "Inquiry"("inquirerUserId");

ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_inquirerUserId_fkey" FOREIGN KEY ("inquirerUserId") REFERENCES "User"("id") ON DELETE SET ON UPDATE CASCADE;
