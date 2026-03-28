import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

type Params = { params: Promise<{ credentialId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const { credentialId } = await params;
  const decoded = decodeURIComponent(credentialId);
  const row = await prisma.webAuthnCredential.findFirst({
    where: { credentialId: decoded, userId: session.user.id },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.webAuthnCredential.delete({ where: { credentialId: decoded } });
  return NextResponse.json({ ok: true });
}
