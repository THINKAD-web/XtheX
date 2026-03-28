import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { webauthnOrigin, webauthnRpId } from "@/lib/security/webauthn-config";
import { withRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

type RegResponse = Parameters<typeof verifyRegistrationResponse>[0]["response"];

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

  const userId = session.user.id;
  const identifier = `wa-reg:${userId}`;
  const row = await prisma.verificationToken.findFirst({
    where: { identifier, expires: { gt: new Date() } },
    orderBy: { expires: "desc" },
  });
  if (!row) {
    return NextResponse.json({ error: "Challenge expired — try again" }, { status: 400 });
  }

  const body = (await req.json()) as { response?: RegResponse };
  if (!body.response) {
    return NextResponse.json({ error: "Missing credential" }, { status: 400 });
  }

  const host = req.headers.get("host");
  const rpID = webauthnRpId(host);
  const origin = webauthnOrigin(req);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: row.token,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (e) {
    console.error("[webauthn] verifyRegistrationResponse", e);
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Not verified" }, { status: 400 });
  }

  const cred = verification.registrationInfo.credential;

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: row.identifier, token: row.token } },
  });

  await prisma.webAuthnCredential.upsert({
    where: { credentialId: cred.id },
    create: {
      credentialId: cred.id,
      userId,
      credentialPublicKey: Buffer.from(cred.publicKey).toString("base64url"),
      counter: cred.counter,
      transports: cred.transports?.join(",") ?? null,
    },
    update: {
      credentialPublicKey: Buffer.from(cred.publicKey).toString("base64url"),
      counter: cred.counter,
      transports: cred.transports?.join(",") ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
