import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCommunitySession } from "@/lib/community/require-session";

export const runtime = "nodejs";

const bodySchema = z.object({
  body: z.string().trim().min(1).max(8000),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireCommunitySession();
  if (auth instanceof NextResponse) return auth;

  const { id: postId } = await ctx.params;
  if (!postId) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const exists = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const comment = await prisma.forumComment.create({
    data: {
      postId,
      authorId: auth.userId,
      body: parsed.data.body,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ ok: true, comment });
}
