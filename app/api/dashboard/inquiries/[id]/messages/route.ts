import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { assertInquiryThreadAccess } from "@/lib/inquiry/assert-thread-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const postSchema = z.object({
  body: z.string().min(1).max(8000),
  attachmentUrl: z.string().url().max(2000).optional(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!userId || (role !== UserRole.ADVERTISER && role !== UserRole.MEDIA_OWNER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { prisma } = await import("@/lib/prisma");
  const gate = await assertInquiryThreadAccess(id, userId, role);
  if (!gate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.inquiryThreadMessage.findMany({
    where: { inquiryId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      attachmentUrl: true,
      createdAt: true,
      authorId: true,
      readAt: true,
    },
  });

  return NextResponse.json({ ok: true, messages });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!userId || (role !== UserRole.ADVERTISER && role !== UserRole.MEDIA_OWNER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const gate = await assertInquiryThreadAccess(id, userId, role);
  if (!gate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const msg = await prisma.inquiryThreadMessage.create({
    data: {
      inquiryId: id,
      authorId: userId,
      body: parsed.data.body.trim(),
      attachmentUrl: parsed.data.attachmentUrl?.trim() || null,
    },
    select: {
      id: true,
      body: true,
      attachmentUrl: true,
      createdAt: true,
      authorId: true,
      readAt: true,
    },
  });

  return NextResponse.json({ ok: true, message: msg });
}
