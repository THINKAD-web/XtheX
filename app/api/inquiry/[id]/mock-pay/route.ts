import { NextResponse } from "next/server";
import { InquiryStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;

  if (!userId || role !== UserRole.ADVERTISER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // ok
  }
  const locale =
    body && typeof body === "object" && "locale" in body && typeof (body as any).locale === "string"
      ? ((body as any).locale as string).trim()
      : null;

  const row = await prisma.inquiry.findFirst({
    where: { id, advertiserId: userId },
    select: { id: true, status: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (row.status !== InquiryStatus.PENDING) {
    return NextResponse.json(
      { ok: true, id: row.id, status: row.status },
      { status: 200 },
    );
  }

  const updated = await prisma.inquiry.update({
    where: { id: row.id },
    data: { status: InquiryStatus.REPLIED },
    select: { id: true, status: true },
  });

  if (locale) {
    revalidatePath(`/${locale}/dashboard/advertiser/inquiries`);
    revalidatePath(`/${locale}/explore`);
  }
  revalidatePath("/dashboard/advertiser/inquiries");
  revalidatePath("/explore");

  return NextResponse.json({ ok: true, id: updated.id, status: updated.status });
}

