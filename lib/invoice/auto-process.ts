import {
  CampaignInvoiceStatus,
  CampaignStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  sendCampaignInvoiceIssuedEmail,
  sendCampaignInvoiceReminderEmail,
} from "@/lib/email/send-email";
import { createUserNotificationIfEnabled } from "@/lib/notifications/category-prefs";
import { computeCampaignEndAt } from "./compute-campaign-end";

const MS_HOUR = 3600000;
const MS_DAY = 86400000;

function dueDaysAfterEnd(): number {
  const n = parseInt(process.env.INVOICE_DUE_DAYS_AFTER_END ?? "14", 10);
  return Number.isFinite(n) && n > 0 ? n : 14;
}

function reminderBeforeDueDays(): number {
  const n = parseInt(process.env.INVOICE_REMINDER_BEFORE_DUE_DAYS ?? "3", 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

const MAX_REMINDERS = 8;

export type AutoInvoiceJobResult = {
  invoicesCreated: number;
  issueEmailsSent: number;
  remindersSent: number;
  errors: string[];
};

export async function runAutoInvoiceJob(): Promise<AutoInvoiceJobResult> {
  const now = new Date();
  let invoicesCreated = 0;
  let issueEmailsSent = 0;
  let remindersSent = 0;
  const errors: string[] = [];

  const eligibleStatuses = [CampaignStatus.SUBMITTED, CampaignStatus.APPROVED];

  const candidates = await prisma.campaign.findMany({
    where: {
      status: { in: eligibleStatuses },
      invoice: { is: null },
    },
    include: { user: { select: { email: true } } },
  });

  for (const c of candidates) {
    const endAt = computeCampaignEndAt(c);
    if (endAt.getTime() > now.getTime()) continue;

    const dueAt = new Date(endAt.getTime() + dueDaysAfterEnd() * MS_DAY);
    const title = c.title?.trim() || "Untitled campaign";

    try {
      const inv = await prisma.campaignInvoice.create({
        data: {
          campaignId: c.id,
          userId: c.userId,
          amountKrw: c.budget_krw,
          campaignEndAt: endAt,
          dueAt,
          status: CampaignInvoiceStatus.OPEN,
        },
      });
      invoicesCreated++;

      await createUserNotificationIfEnabled({
        userId: c.userId,
        type: "CAMPAIGN_UPDATE",
        title: "Invoice issued",
        message: `${title}: ${c.budget_krw.toLocaleString("en-US")} KRW due ${dueAt.toISOString().slice(0, 10)} (UTC)`,
        link: "/dashboard/advertiser/invoices",
      });

      const r = await sendCampaignInvoiceIssuedEmail({
        to: c.user.email,
        campaignTitle: title,
        amountKrw: c.budget_krw,
        campaignEndAtIso: endAt.toISOString(),
        dueAtIso: dueAt.toISOString(),
        invoiceId: inv.id,
      });
      if (r.ok) {
        issueEmailsSent++;
        await prisma.campaignInvoice.update({
          where: { id: inv.id },
          data: { initialEmailSentAt: now },
        });
      }
    } catch (e) {
      errors.push(
        `create ${c.id}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  const pendingIssue = await prisma.campaignInvoice.findMany({
    where: {
      status: CampaignInvoiceStatus.OPEN,
      initialEmailSentAt: null,
    },
    include: {
      campaign: { select: { title: true } },
      user: { select: { email: true } },
    },
  });

  for (const inv of pendingIssue) {
    const title = inv.campaign.title?.trim() || "Untitled campaign";
    const r = await sendCampaignInvoiceIssuedEmail({
      to: inv.user.email,
      campaignTitle: title,
      amountKrw: inv.amountKrw,
      campaignEndAtIso: inv.campaignEndAt.toISOString(),
      dueAtIso: inv.dueAt.toISOString(),
      invoiceId: inv.id,
    });
    if (r.ok) {
      issueEmailsSent++;
      await prisma.campaignInvoice.update({
        where: { id: inv.id },
        data: { initialEmailSentAt: now },
      });
    }
  }

  const openInv = await prisma.campaignInvoice.findMany({
    where: { status: CampaignInvoiceStatus.OPEN },
    include: {
      campaign: { select: { title: true } },
      user: { select: { email: true } },
    },
  });

  const beforeDays = reminderBeforeDueDays();

  for (const inv of openInv) {
    if (inv.reminderCount >= MAX_REMINDERS) continue;
    if (!inv.initialEmailSentAt) continue;

    const lastSend =
      inv.lastReminderAt?.getTime() ?? inv.initialEmailSentAt.getTime();
    const hoursSince = (now.getTime() - lastSend) / MS_HOUR;

    const due = inv.dueAt.getTime();
    const msToDue = due - now.getTime();
    const daysToDue = msToDue / MS_DAY;
    const overdue = msToDue < 0;

    let variant: "before_due" | "overdue" | null = null;
    if (!overdue) {
      if (daysToDue <= beforeDays && daysToDue >= 0 && hoursSince >= 24) {
        variant = "before_due";
      }
    } else if (hoursSince >= 48) {
      variant = "overdue";
    }

    if (!variant) continue;

    const title = inv.campaign.title?.trim() || "Untitled campaign";

    try {
      const r = await sendCampaignInvoiceReminderEmail({
        to: inv.user.email,
        campaignTitle: title,
        amountKrw: inv.amountKrw,
        dueAtIso: inv.dueAt.toISOString(),
        invoiceId: inv.id,
        variant,
      });
      if (r.ok) {
        remindersSent++;
        await prisma.campaignInvoice.update({
          where: { id: inv.id },
          data: {
            lastReminderAt: now,
            reminderCount: { increment: 1 },
          },
        });
      }
    } catch (e) {
      errors.push(
        `remind ${inv.id}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  return { invoicesCreated, issueEmailsSent, remindersSent, errors };
}
