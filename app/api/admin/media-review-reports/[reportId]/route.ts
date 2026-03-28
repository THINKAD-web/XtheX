import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MediaReviewReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";

type Ctx = { params: Promise<{ reportId: string }> };

const bodySchema = z.object({
  action: z.enum(["dismiss", "hide_review"]),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reportId } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const report = await prisma.mediaReviewReport.findUnique({
    where: { id: reportId },
    select: { id: true, reviewId: true, status: true },
  });

  if (!report || report.status !== MediaReviewReportStatus.PENDING) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();

  if (parsed.data.action === "dismiss") {
    await prisma.mediaReviewReport.update({
      where: { id: reportId },
      data: {
        status: MediaReviewReportStatus.DISMISSED,
        resolvedAt: now,
        resolvedById: admin.id,
      },
    });
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction([
    prisma.mediaReviewReport.update({
      where: { id: reportId },
      data: {
        status: MediaReviewReportStatus.ACTIONED,
        resolvedAt: now,
        resolvedById: admin.id,
      },
    }),
    prisma.mediaReviewReport.updateMany({
      where: {
        reviewId: report.reviewId,
        status: MediaReviewReportStatus.PENDING,
        id: { not: reportId },
      },
      data: {
        status: MediaReviewReportStatus.DISMISSED,
        resolvedAt: now,
        resolvedById: admin.id,
      },
    }),
    prisma.mediaReview.update({
      where: { id: report.reviewId },
      data: { visible: false },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
