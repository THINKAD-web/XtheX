import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { buildOtpauthUrl, generateTotpSecret } from "@/lib/security/two-factor";

export const runtime = "nodejs";

export async function POST() {
  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = generateTotpSecret();
  const otpauthUrl = buildOtpauthUrl(session.user.email, secret);
  return NextResponse.json({ secret, otpauthUrl });
}
