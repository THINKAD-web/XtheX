import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/security/rate-limit";
import { validateOrigin } from "@/lib/security/csrf";
import {
  REFEREE_BONUS_POINTS,
  REFERRER_BONUS_POINTS,
} from "@/lib/referral/constants";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  role: z
    .nativeEnum(UserRole)
    .refine((r) => r === UserRole.ADVERTISER || r === UserRole.MEDIA_OWNER, {
      message: "Invalid role",
    }),
  referralCode: z.string().max(32).optional(),
});

function normalizeReferralInput(raw: string | undefined): string {
  if (!raw) return "";
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function POST(req: Request) {
  const rl = withRateLimit(req, { limit: 5, windowMs: 60_000 });
  if (rl) return rl;
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, password, name, role, referralCode: referralRaw } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "이미 가입된 이메일입니다." },
      { status: 409 },
    );
  }

  const codeNorm = normalizeReferralInput(referralRaw);
  let referrerId: string | null = null;
  if (codeNorm.length > 0) {
    if (codeNorm.length !== 8) {
      return NextResponse.json(
        { error: "Invalid referral code", code: "REFERRAL_INVALID" as const },
        { status: 400 },
      );
    }
    const referrer = await prisma.user.findUnique({
      where: { referralCode: codeNorm },
      select: { id: true, email: true, role: true },
    });
    if (!referrer || referrer.role === UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Invalid referral code", code: "REFERRAL_INVALID" as const },
        { status: 400 },
      );
    }
    if (referrer.email.toLowerCase() === normalizedEmail) {
      return NextResponse.json(
        { error: "Cannot use your own referral code", code: "REFERRAL_SELF" as const },
        { status: 400 },
      );
    }
    referrerId = referrer.id;
  }

  const hashed = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email: normalizedEmail,
          name: name.trim(),
          password: hashed,
          role,
          onboardingCompleted: false,
          referredById: referrerId,
          referralCreditPoints: referrerId ? REFEREE_BONUS_POINTS : 0,
        },
      });
      if (referrerId) {
        await tx.user.update({
          where: { id: referrerId },
          data: {
            referralCreditPoints: { increment: REFERRER_BONUS_POINTS },
          },
        });
      }
    });
  } catch (e) {
    console.error("[signup]", e);
    return NextResponse.json(
      { error: "가입 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
