import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { webauthnOrigin, webauthnRpId } from "@/lib/security/webauthn-config";
import { withRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, { limit: 15, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const userId = session.user.id;
  const host = req.headers.get("host");
  const rpID = webauthnRpId(host);

  const existing = await prisma.webAuthnCredential.findMany({
    where: { userId },
    select: { credentialId: true, transports: true },
  });

  const options = await generateRegistrationOptions({
    rpName: "XtheX",
    rpID,
    userName: session.user.email,
    userID: new TextEncoder().encode(userId),
    userDisplayName: session.user.name ?? session.user.email,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: existing.map((c) => ({ id: c.credentialId })),
  });

  const identifier = `wa-reg:${userId}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: options.challenge,
      expires: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  return NextResponse.json(options);
}
