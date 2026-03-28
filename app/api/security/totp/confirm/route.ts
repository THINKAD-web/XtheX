import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import {
  generateBackupCodes,
  hashBackupCodes,
  verifyTotpToken,
} from "@/lib/security/two-factor";
import { withRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, { limit: 10, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = (await req.json()) as { secret?: string; code?: string };
  const secret = typeof body.secret === "string" ? body.secret.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!secret || !code || !verifyTotpToken(secret, code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const plainBackup = generateBackupCodes(8);
  const hashed = hashBackupCodes(plainBackup);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: true,
      twoFactorBackupCodes: JSON.stringify(hashed),
    },
  });

  return NextResponse.json({ ok: true, backupCodes: plainBackup });
}
