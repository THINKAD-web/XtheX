import {
  AdvertiserLedgerKind,
  InquiryStripePaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type MediaOwnerRevenueRow = {
  key: string;
  source: "stripe" | "ledger_dev";
  amountKrw: number;
  at: Date;
  mediaName: string;
};

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfUtcMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfUtcYear(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

function netStripeRevenue(p: {
  amountKrw: number;
  refundedAmountKrw: number;
  status: InquiryStripePaymentStatus;
}): number {
  if (p.status === InquiryStripePaymentStatus.PAID) {
    return p.amountKrw;
  }
  if (p.status === InquiryStripePaymentStatus.PARTIALLY_REFUNDED) {
    return Math.max(0, p.amountKrw - p.refundedAmountKrw);
  }
  return 0;
}

export async function getMediaOwnerRevenueSummary(mediaOwnerId: string): Promise<{
  totalKrw: number;
  todayKrw: number;
  monthKrw: number;
  yearKrw: number;
  rows: MediaOwnerRevenueRow[];
}> {
  const now = new Date();
  const day0 = startOfUtcDay(now);
  const month0 = startOfUtcMonth(now);
  const year0 = startOfUtcYear(now);

  const stripeStatuses: InquiryStripePaymentStatus[] = [
    InquiryStripePaymentStatus.PAID,
    InquiryStripePaymentStatus.PARTIALLY_REFUNDED,
  ];

  const [stripePaid, ledgerMock] = await Promise.all([
    prisma.inquiryStripePayment.findMany({
      where: {
        status: { in: stripeStatuses },
        inquiry: { media: { createdById: mediaOwnerId } },
      },
      orderBy: { paidAt: "desc" },
      take: 500,
      select: {
        id: true,
        amountKrw: true,
        refundedAmountKrw: true,
        status: true,
        paidAt: true,
        createdAt: true,
        inquiry: { select: { media: { select: { mediaName: true } } } },
      },
    }),
    prisma.advertiserLedgerEntry.findMany({
      where: {
        kind: AdvertiserLedgerKind.INQUIRY_CHECKOUT_PAYMENT,
        inquiryStripePaymentId: null,
        inquiry: { media: { createdById: mediaOwnerId } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        amountKrw: true,
        createdAt: true,
        inquiry: { select: { media: { select: { mediaName: true } } } },
      },
    }),
  ]);

  const rows: MediaOwnerRevenueRow[] = [
    ...stripePaid.map((p) => {
      const net = netStripeRevenue(p);
      return {
        key: `s-${p.id}`,
        source: "stripe" as const,
        amountKrw: net,
        at: p.paidAt ?? p.createdAt,
        mediaName: p.inquiry.media.mediaName,
      };
    }),
    ...ledgerMock.map((l) => ({
      key: `l-${l.id}`,
      source: "ledger_dev" as const,
      amountKrw: l.amountKrw,
      at: l.createdAt,
      mediaName: l.inquiry?.media?.mediaName ?? "—",
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const totalKrw = rows.reduce((s, r) => s + r.amountKrw, 0);
  const todayKrw = rows
    .filter((r) => r.at >= day0)
    .reduce((s, r) => s + r.amountKrw, 0);
  const monthKrw = rows
    .filter((r) => r.at >= month0)
    .reduce((s, r) => s + r.amountKrw, 0);
  const yearKrw = rows
    .filter((r) => r.at >= year0)
    .reduce((s, r) => s + r.amountKrw, 0);

  return { totalKrw, todayKrw, monthKrw, yearKrw, rows };
}
