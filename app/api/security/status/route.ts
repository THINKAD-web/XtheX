import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      demo: true,
      twoFactorEnabled: false,
      emailOtpEnabled: false,
      smsOtpEnabled: false,
      phoneE164: null,
      devices: [],
      passkeys: [],
    });
  }

  const userId = session.user.id;
  const [user, devices, passkeys] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        emailOtpEnabled: true,
        smsOtpEnabled: true,
        phoneE164: true,
        securityPhoneVerified: true,
      },
    }),
    prisma.loginDevice.findMany({
      where: { userId },
      orderBy: { lastSeenAt: "desc" },
      select: {
        id: true,
        deviceKey: true,
        nickname: true,
        userAgent: true,
        ipLast: true,
        lastSeenAt: true,
        createdAt: true,
      },
    }),
    prisma.webAuthnCredential.findMany({
      where: { userId },
      select: { credentialId: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    twoFactorEnabled: user?.twoFactorEnabled ?? false,
    emailOtpEnabled: user?.emailOtpEnabled ?? false,
    smsOtpEnabled: user?.smsOtpEnabled ?? false,
    phoneE164: user?.phoneE164 ?? null,
    securityPhoneVerified: user?.securityPhoneVerified ?? false,
    devices,
    passkeys,
  });
}
