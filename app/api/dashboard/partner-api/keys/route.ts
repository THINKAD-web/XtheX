import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { generatePartnerApiKey } from "@/lib/partner-api/key-crypto";

export const runtime = "nodejs";

const MAX_KEYS = 10;

const PostSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || user.role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const keys = await prisma.partnerApiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
      revokedAt: true,
      lastUsedAt: true,
    },
  });

  return NextResponse.json({ ok: true, keys });
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || user.role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const active = await prisma.partnerApiKey.count({
    where: { userId: session.user.id, revokedAt: null },
  });
  if (active >= MAX_KEYS) {
    return NextResponse.json({ error: "Key limit reached" }, { status: 400 });
  }

  const { rawKey, keyPrefix, keyHash } = generatePartnerApiKey();
  const row = await prisma.partnerApiKey.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      keyPrefix,
      keyHash,
    },
    select: { id: true, name: true, keyPrefix: true, createdAt: true },
  });

  return NextResponse.json({
    ok: true,
    key: row,
    /** 클라이언트에만 1회 표시 */
    secret: rawKey,
  });
}
