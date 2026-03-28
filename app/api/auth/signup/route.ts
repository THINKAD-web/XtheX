import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/security/rate-limit";
import { validateOrigin } from "@/lib/security/csrf";

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
});

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

  const { email, password, name, role } = parsed.data;
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

  const hashed = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        password: hashed,
        role,
        onboardingCompleted: false,
      },
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
