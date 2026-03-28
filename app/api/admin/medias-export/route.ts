import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getAuthSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/find-user-by-clerk";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await findUserById(session.user.id);
  if (!dbUser || dbUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const medias = await prisma.media.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      mediaName: true,
      category: true,
      locationJson: true,
      price: true,
      exposureJson: true,
      status: true,
      globalCountryCode: true,
      currency: true,
    },
  });

  const header = "Name,Country,City,Category,Price,Currency,Daily Traffic,Status";

  const rows = medias.map((m) => {
    const loc = m.locationJson as Record<string, unknown> | null;
    const exp = m.exposureJson as Record<string, unknown> | null;

    const country =
      m.globalCountryCode ?? extractCountry(loc?.address as string | undefined);
    const city =
      (loc?.district as string) ?? (loc?.address as string) ?? "";
    const dailyTraffic = exp?.daily_traffic ?? "";

    return [
      esc(m.mediaName),
      esc(country),
      esc(city),
      esc(m.category),
      m.price ?? "",
      esc(m.currency),
      dailyTraffic,
      esc(m.status),
    ].join(",");
  });

  const csv = "\uFEFF" + [header, ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="xthex-medias-export.csv"',
    },
  });
}

function esc(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function extractCountry(address: string | undefined): string {
  if (!address) return "";
  if (/서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주/.test(address)) {
    return "KR";
  }
  const first = address.split(/[,\s]+/)[0]?.trim() ?? "";
  return first;
}
