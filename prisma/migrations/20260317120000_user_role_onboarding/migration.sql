-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADVERTISER', 'MEDIA_OWNER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "User" ADD COLUMN "role_temp" "UserRole";

UPDATE "User" SET "role_temp" = CASE "role"::text
  WHEN 'PARTNER' THEN 'MEDIA_OWNER'::"UserRole"
  WHEN 'BRAND' THEN 'ADVERTISER'::"UserRole"
  WHEN 'ADMIN' THEN 'ADMIN'::"UserRole"
  ELSE 'ADVERTISER'::"UserRole"
END;

UPDATE "User" SET "onboardingCompleted" = true;

ALTER TABLE "User" DROP COLUMN "role";

ALTER TABLE "User" RENAME COLUMN "role_temp" TO "role";

ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADVERTISER'::"UserRole";

DROP TYPE "Role";
