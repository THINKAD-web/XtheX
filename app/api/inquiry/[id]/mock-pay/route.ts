import { NextResponse } from "next/server";
import {
  AdvertiserLedgerKind,
  InquiryContractStatus,
  InquiryStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { revalidatePath } from "next/cache";
import { resolveInquiryCheckoutAmountKrw } from "@/lib/payments/inquiry-checkout-amount";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Mock payment disabled" }, { status: 403 });
  }

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
    body && typeof body === "object" && "locale" in body && typeof (body as { locale?: string }).locale === "string"
      ? (body as { locale: string }).locale.trim()
      : null;

  const row = await prisma.inquiry.findFirst({
    where: { id, advertiserId: userId },
    include: { contract: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (row.contract?.status !== InquiryContractStatus.COMPLETED) {
    return NextResponse.json(
      { error: "Contract must be completed before payment" },
      { status: 400 },
    );
  }

  if (row.status === InquiryStatus.REPLIED) {
    return NextResponse.json({ ok: true, id: row.id, status: row.status });
  }

  if (row.status !== InquiryStatus.PENDING) {
    return NextResponse.json({ error: "Invalid inquiry status" }, { status: 400 });
  }

  const amountKrw = resolveInquiryCheckoutAmountKrw(row);

  await prisma.$transaction(async (tx) => {
    await tx.inquiry.update({
      where: { id: row.id },
      data: { status: InquiryStatus.REPLIED },
    });
    const existing = await tx.advertiserLedgerEntry.findFirst({
      where: { inquiryId: row.id, kind: AdvertiserLedgerKind.INQUIRY_CHECKOUT_PAYMENT },
    });
    if (!existing) {
      await tx.advertiserLedgerEntry.create({
        data: {
          userId,
          kind: AdvertiserLedgerKind.INQUIRY_CHECKOUT_PAYMENT,
          amountKrw,
          description: "Inquiry payment (mock / dev)",
          inquiryId: row.id,
        },
      });
    }
  });

  if (locale) {
    revalidatePath(`/${locale}/dashboard/advertiser/inquiries`);
    revalidatePath(`/${locale}/explore`);
  }
  revalidatePath("/dashboard/advertiser/inquiries");
  revalidatePath("/explore");

  return NextResponse.json({ ok: true, id: row.id, status: InquiryStatus.REPLIED });
}
