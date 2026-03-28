import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { verifyAndConsumeBackupCode, verifyTotpToken } from "@/lib/security/two-factor";
import { withRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, { limit: 8, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = (await req.json()) as { password?: string; code?: string };
  const password = typeof body.password === "string" ? body.password : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!password || !code) {
    return NextResponse.json({ error: "Password and code required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      password: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorBackupCodes: true,
    },
  });
  if (!user?.password || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
  }

  const pwOk = await bcrypt.compare(password, user.password);
  if (!pwOk) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const totpOk = verifyTotpToken(user.twoFactorSecret, code);
  let ok = totpOk;
  if (!totpOk) {
    ok = await verifyAndConsumeBackupCode(
      session.user.id,
      code,
      async (next) => {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { twoFactorBackupCodes: next },
        });
      },
      user.twoFactorBackupCodes,
    );
  }
  if (!ok) {
    return NextResponse.json({ error: "Invalid authenticator code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
    },
  });

  return NextResponse.json({ ok: true });
}
