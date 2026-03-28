import { NextResponse } from "next/server";
import { MediaReviewReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reports = await prisma.mediaReviewReport.findMany({
    where: { status: MediaReviewReportStatus.PENDING },
    orderBy: { createdAt: "asc" },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      review: {
        include: {
          media: { select: { id: true, mediaName: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json({ reports });
}
