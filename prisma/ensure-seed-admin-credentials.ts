/**
 * 테스트 관리자 admin@xthex.test / password123 을 DB에 맞춤.
 * - 이미 같은 이메일로 가입한 경우: 비밀번호·역할만 갱신 (로그인 가능하게)
 * - 없으면 시드와 동일한 ID로 생성
 *
 * 사용: npx tsx prisma/ensure-seed-admin-credentials.ts
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });
config();

import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const EMAIL = "admin@xthex.test";
const PLAIN = "password123";
const BCRYPT_ROUNDS = 12;
const STABLE_ID = "33333333-3333-3333-3333-333333333333";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");

const pool = new Pool({ connectionString: url, max: 1 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const hashed = await bcrypt.hash(PLAIN, BCRYPT_ROUNDS);
  const existing = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { id: true, clerkId: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hashed,
        role: UserRole.ADMIN,
        onboardingCompleted: true,
        clerkId: existing.clerkId ?? "test_admin",
        name: "Test Admin",
      },
    });
    console.log(
      `[ensure-seed-admin] 업데이트: ${EMAIL} → 비밀번호 "${PLAIN}", role=ADMIN (id=${existing.id})`,
    );
    return;
  }

  try {
    await prisma.user.create({
      data: {
        id: STABLE_ID,
        email: EMAIL,
        name: "Test Admin",
        password: hashed,
        role: UserRole.ADMIN,
        clerkId: "test_admin",
        onboardingCompleted: true,
      },
    });
    console.log(`[ensure-seed-admin] 생성: ${EMAIL} / "${PLAIN}"`);
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      console.error(
        "[ensure-seed-admin] id 또는 email 충돌. prisma/seed.ts 실행 후 다시 시도하세요.",
      );
      throw e;
    }
    throw e;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
