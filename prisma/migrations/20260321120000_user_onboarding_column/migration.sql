-- Prisma User 모델과 DB 드리프트 시 "column does not exist" 방지
-- (기존 DB에 User는 있으나 onboardingCompleted 없는 경우)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
