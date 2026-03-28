import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ForumReportTarget } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCommunitySession } from "@/lib/community/require-session";

export const runtime = "nodejs";

const schema = z
  .object({
    targetType: z.enum(["POST", "COMMENT"]),
    postId: z.string().uuid().optional(),
    commentId: z.string().uuid().optional(),
    reason: z.string().trim().max(2000).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.targetType === "POST") {
      if (!d.postId) ctx.addIssue({ code: "custom", message: "postId required" });
      if (d.commentId) ctx.addIssue({ code: "custom", message: "commentId forbidden" });
    } else {
      if (!d.commentId) ctx.addIssue({ code: "custom", message: "commentId required" });
      if (d.postId) ctx.addIssue({ code: "custom", message: "postId forbidden" });
    }
  });

export async function POST(req: NextRequest) {
  const auth = await requireCommunitySession();
  if (auth instanceof NextResponse) return auth;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const { targetType, postId, commentId, reason } = parsed.data;

  if (targetType === "POST" && postId) {
    const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    const dup = await prisma.forumReport.findFirst({
      where: { reporterId: auth.userId, postId, targetType: ForumReportTarget.POST },
    });
    if (dup) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    await prisma.forumReport.create({
      data: {
        targetType: ForumReportTarget.POST,
        postId,
        reporterId: auth.userId,
        reason: reason ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (targetType === "COMMENT" && commentId) {
    const comment = await prisma.forumComment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });
    if (!comment) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    const dup = await prisma.forumReport.findFirst({
      where: { reporterId: auth.userId, commentId, targetType: ForumReportTarget.COMMENT },
    });
    if (dup) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    await prisma.forumReport.create({
      data: {
        targetType: ForumReportTarget.COMMENT,
        commentId,
        reporterId: auth.userId,
        reason: reason ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
}
