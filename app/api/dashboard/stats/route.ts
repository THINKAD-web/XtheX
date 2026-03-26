import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function toDateOnly(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function fmtMonth(d: Date): string {
  return `${d.getMonth() + 1}월`;
}

function fmtDay(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!userId || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (role === UserRole.ADVERTISER) {
    const now = new Date();
    const start = toDateOnly(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));

    const [totalInquiries, pendingInquiries, budgetAgg, recentInquiries, cpmAgg] =
      await Promise.all([
        prisma.inquiry.count({ where: { advertiserId: userId } }),
        prisma.inquiry.count({
          where: { advertiserId: userId, status: "PENDING" },
        }),
        prisma.inquiry.aggregate({
          where: { advertiserId: userId },
          _sum: { budget: true },
        }),
        prisma.inquiry.findMany({
          where: { advertiserId: userId, createdAt: { gte: start } },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.media.aggregate({
          where: { status: "PUBLISHED", cpm: { not: null } },
          _avg: { cpm: true },
        }),
      ]);

    // 30일을 5개 주차 버킷으로 그룹
    const buckets = Array.from({ length: 5 }).map((_, i) => {
      const bStart = new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      return { m: fmtDay(bStart), inquiries: 0 };
    });
    for (const r of recentInquiries) {
      const idx = Math.min(
        4,
        Math.max(
          0,
          Math.floor(
            (toDateOnly(r.createdAt).getTime() - start.getTime()) /
              (7 * 24 * 60 * 60 * 1000),
          ),
        ),
      );
      buckets[idx]!.inquiries += 1;
    }

    const replied = await prisma.inquiry.count({
      where: { advertiserId: userId, status: "REPLIED" },
    });
    const closed = await prisma.inquiry.count({
      where: { advertiserId: userId, status: "CLOSED" },
    });

    return NextResponse.json({
      role: "ADVERTISER" as const,
      totalInquiries,
      pendingInquiries,
      totalBudget: budgetAgg._sum.budget ?? 0,
      avgPublishedCpm: cpmAgg._avg.cpm ? Math.round(cpmAgg._avg.cpm) : 0,
      recentInquiriesTrend: buckets,
      inquiryStatusDist: [
        { name: "PENDING", value: pendingInquiries },
        { name: "REPLIED", value: replied },
        { name: "CLOSED", value: closed },
      ],
    });
  }

  if (role === UserRole.MEDIA_OWNER) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(monthStart);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const [totalMedias, publishedMedias, pendingMedias, rejectedMedias, totalReceivedInquiries, rows] =
      await Promise.all([
        prisma.media.count({ where: { createdById: userId } }),
        prisma.media.count({
          where: { createdById: userId, status: "PUBLISHED" },
        }),
        prisma.media.count({
          where: { createdById: userId, status: "PENDING" },
        }),
        prisma.media.count({
          where: { createdById: userId, status: "REJECTED" },
        }),
        prisma.inquiry.count({
          where: { media: { createdById: userId } },
        }),
        prisma.inquiry.findMany({
          where: {
            media: { createdById: userId },
            createdAt: { gte: sixMonthsAgo },
          },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
      ]);

    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
      return { m: fmtMonth(d), inquiries: 0, y: d.getFullYear(), mo: d.getMonth() };
    });
    for (const r of rows) {
      const y = r.createdAt.getFullYear();
      const mo = r.createdAt.getMonth();
      const target = months.find((x) => x.y === y && x.mo === mo);
      if (target) target.inquiries += 1;
    }

    return NextResponse.json({
      role: "MEDIA_OWNER" as const,
      totalMedias,
      publishedMedias,
      pendingMedias,
      rejectedMedias,
      totalReceivedInquiries,
      monthlyInquiriesTrend: months.map(({ m, inquiries }) => ({ m, inquiries })),
      mediaStatusDist: [
        { name: "PENDING", value: pendingMedias },
        { name: "PUBLISHED", value: publishedMedias },
        { name: "REJECTED", value: rejectedMedias },
      ],
    });
  }

  return NextResponse.json({ error: "Unsupported role" }, { status: 400 });
}

