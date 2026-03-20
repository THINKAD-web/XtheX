/**
 * User 테이블이 비어 있으면 테스트 유저 1명 생성.
 * 사용: npx tsx prisma/ensure-test-user.ts
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });
config();

import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");
const pool = new Pool({ connectionString: url, max: 1 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`User 테이블에 이미 ${count}명 있음. 스킵.`);
    return;
  }
  const user = await prisma.user.create({
    data: {
      clerkId: "test",
      role: UserRole.MEDIA_OWNER,
      onboardingCompleted: true,
      email: "test@test.com",
      name: "Test Partner",
    },
  });
  console.log("테스트 유저 생성:", user.id, user.clerkId, user.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
