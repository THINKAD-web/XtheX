import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

type Params = { params: Promise<{ deviceId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const { deviceId } = await params;
  const row = await prisma.loginDevice.findFirst({
    where: { id: deviceId, userId: session.user.id },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.loginDevice.delete({ where: { id: deviceId } });
  return NextResponse.json({ ok: true });
}
