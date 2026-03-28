import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateReferralCodeSegment } from "@/lib/referral/generate-code";

const MAX_ATTEMPTS = 12;

/**
 * 사용자에게 아직 없으면 고유 referralCode를 발급합니다.
 */
export async function ensureUserReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateReferralCodeSegment(8);
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
      });
      return code;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        continue;
      }
      throw e;
    }
  }

  throw new Error("Could not allocate referral code");
}
