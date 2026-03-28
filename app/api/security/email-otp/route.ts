import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { sendSecurityOtpEmail } from "@/lib/email/send-email";
import { withRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, { limit: 8, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = (await req.json()) as { action?: string; code?: string };
  const userId = session.user.id;
  const identifier = `sec-email:${userId}`;

  if (body.action === "send") {
    const code = String(Math.floor(100_000 + Math.random() * 900_000));
    const token = await bcrypt.hash(code, 8);
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const sent = await sendSecurityOtpEmail(session.user.email, code);
    if (!sent.ok && !(sent as { skipped?: boolean }).skipped) {
      return NextResponse.json({ error: "Could not send email" }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      ...(process.env.NODE_ENV === "development" && (sent as { skipped?: boolean }).skipped
        ? { devCode: code }
        : {}),
    });
  }

  if (body.action === "verify") {
    const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
    if (code.length !== 6) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const row = await prisma.verificationToken.findFirst({
      where: { identifier, expires: { gt: new Date() } },
      orderBy: { expires: "desc" },
    });
    if (!row || !(await bcrypt.compare(code, row.token))) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: row.identifier, token: row.token } },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { emailOtpEnabled: true },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
