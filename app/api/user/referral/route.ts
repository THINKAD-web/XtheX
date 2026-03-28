import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { ensureUserReferralCode } from "@/lib/referral/ensure-referral-code";
import {
  REFEREE_BONUS_POINTS,
  REFERRER_BONUS_POINTS,
} from "@/lib/referral/constants";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const code = await ensureUserReferralCode(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCreditPoints: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const invitedCount = await prisma.user.count({
    where: { referredById: userId },
  });

  return NextResponse.json({
    ok: true,
    code,
    creditPoints: user.referralCreditPoints,
    invitedCount,
    referrerBonusPoints: REFERRER_BONUS_POINTS,
    refereeBonusPoints: REFEREE_BONUS_POINTS,
  });
}
