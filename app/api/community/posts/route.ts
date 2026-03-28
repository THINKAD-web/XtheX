import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ForumCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCommunitySession } from "@/lib/community/require-session";

export const runtime = "nodejs";

const createSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(1).max(20_000),
  category: z.enum(["STRATEGY", "REGIONAL_INFO"]),
});

export async function GET(req: NextRequest) {
  const auth = await requireCommunitySession();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const cat = searchParams.get("category") as ForumCategory | null;

  const where: Prisma.ForumPostWhereInput = {};
  if (cat === "STRATEGY" || cat === "REGIONAL_INFO") {
    where.category = cat;
  }
  if (q.length > 0) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, popular] = await Promise.all([
    prisma.forumPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.forumPost.findMany({
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, items, popular });
}

export async function POST(req: NextRequest) {
  const auth = await requireCommunitySession();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const post = await prisma.forumPost.create({
    data: {
      authorId: auth.userId,
      title: parsed.data.title,
      body: parsed.data.body,
      category: parsed.data.category as ForumCategory,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({ ok: true, post });
}
