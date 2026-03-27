import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [mediaCount, countries, inquiryCount] = await Promise.all([
      prisma.media.count({ where: { status: "PUBLISHED" } }),
      prisma.media.groupBy({
        by: ["globalCountryCode"],
        where: { status: "PUBLISHED" },
      }),
      prisma.inquiry.count().catch(() => 0),
    ]);

    const countryCount = countries.length + 1; // KR 포함

    return NextResponse.json({
      mediaCount,
      countryCount,
      inquiryCount,
      accuracy: 95,
    });
  } catch {
    return NextResponse.json({
      mediaCount: 16,
      countryCount: 4,
      inquiryCount: 0,
      accuracy: 95,
    });
  }
}
