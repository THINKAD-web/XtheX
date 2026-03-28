import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { withRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

/** Basic E.164 check (+ and digits, 8–15 digits) */
function isLikelyE164(v: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(v.replace(/\s/g, ""));
}

export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, { limit: 15, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = (await req.json()) as {
    phoneE164?: string | null;
    enableSms2fa?: boolean;
    sendTest?: boolean;
  };

  const data: {
    phoneE164?: string | null;
    smsOtpEnabled?: boolean;
    securityPhoneVerified?: boolean;
  } = {};

  if (body.phoneE164 !== undefined) {
    const raw =
      typeof body.phoneE164 === "string" ? body.phoneE164.trim().replace(/\s/g, "") : "";
    if (raw && !isLikelyE164(raw)) {
      return NextResponse.json({ error: "Use international format, e.g. +821012345678" }, { status: 400 });
    }
    data.phoneE164 = raw || null;
    if (raw) data.securityPhoneVerified = false;
  }
  if (typeof body.enableSms2fa === "boolean") {
    data.smsOtpEnabled = body.enableSms2fa;
  }

  if (Object.keys(data).length === 0 && !body.sendTest) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  if (Object.keys(data).length > 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });
  }

  const twilioReady = Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim(),
  );

  const testPhone =
    typeof body.phoneE164 === "string"
      ? body.phoneE164.trim().replace(/\s/g, "")
      : (await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { phoneE164: true },
        }))?.phoneE164 ?? "";

  if (body.sendTest && testPhone) {
    if (!twilioReady) {
      return NextResponse.json({
        ok: true,
        demo: true,
        message:
          "SMS gateway not configured (set TWILIO_* env vars). Phone number saved for when SMS is enabled.",
      });
    }
    return NextResponse.json({
      ok: false,
      message: "Twilio credentials present — wire send in ops. Number saved.",
    });
  }

  return NextResponse.json({ ok: true });
}
