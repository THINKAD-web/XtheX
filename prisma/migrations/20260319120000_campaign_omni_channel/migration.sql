-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "omniChannel" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Campaign" ADD COLUMN     "omniMediaIds" JSONB;
