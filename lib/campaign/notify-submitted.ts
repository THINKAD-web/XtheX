/**
 * 캠페인 제출 시 매체사/운영 알림 (Resend 이메일·웹훅 등)
 */
import { prisma } from "@/lib/prisma";

function formatKrw(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

async function sendResendToMediaOwners(payload: {
  campaignId: string;
  title: string;
  budgetKrw: number;
  mediaIds: string[];
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[campaign] Resend skipped: RESEND_API_KEY or RESEND_FROM not set",
      );
    }
    return;
  }

  if (payload.mediaIds.length === 0) return;

  const medias = await prisma.media.findMany({
    where: {
      id: { in: payload.mediaIds },
      createdById: { not: null },
    },
    select: { createdById: true },
  });

  const ownerIds = [
    ...new Set(
      medias
        .map((m) => m.createdById)
        .filter((id): id is string => id != null),
    ),
  ];

  if (ownerIds.length === 0) {
    return;
  }

  const owners = await prisma.user.findMany({
    where: { id: { in: ownerIds } },
    select: { email: true },
  });

  const emails = [...new Set(owners.map((u) => u.email.trim()).filter(Boolean))];
  if (emails.length === 0) return;

  const budgetStr = formatKrw(payload.budgetKrw);
  const subject = `새 캠페인 제안 도착 - ${payload.title}, 예산 ${budgetStr}`;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "";

  const dashboardLink = baseUrl
    ? `${baseUrl}/dashboard/campaigns`
    : null;

  const html = [
    "<p>안녕하세요,</p>",
    `<p>귀사 매체가 포함된 <strong>새 캠페인 제안</strong>이 접수되었습니다.</p>`,
    "<ul>",
    `<li>캠페인명: ${escapeHtml(payload.title)}</li>`,
    `<li>예산: ${escapeHtml(budgetStr)}</li>`,
    `<li>캠페인 ID: <code>${escapeHtml(payload.campaignId)}</code></li>`,
    "</ul>",
    dashboardLink
      ? `<p><a href="${escapeHtml(dashboardLink)}">대시보드에서 확인</a></p>`
      : "<p>XtheX 대시보드에서 캠페인을 확인해 주세요.</p>",
    "<p>감사합니다.<br/>XtheX</p>",
  ].join("");

  for (const to of emails) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = (body as { message?: string })?.message ?? (await res.text());
        console.error(`[campaign] Resend failed for ${to}:`, res.status, msg);
      }
    } catch (e) {
      console.error(`[campaign] Resend error for ${to}:`, e);
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function notifyCampaignSubmitted(payload: {
  campaignId: string;
  userId: string;
  mediaIds: string[];
  budgetKrw: number;
  title: string;
}): Promise<void> {
  const webhook = process.env.CAMPAIGN_SUBMIT_WEBHOOK_URL?.trim();
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "campaign_submitted",
          campaignId: payload.campaignId,
          userId: payload.userId,
          mediaIds: payload.mediaIds,
          budgetKrw: payload.budgetKrw,
          title: payload.title,
          at: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error("[campaign] webhook failed", e);
    }
  }

  try {
    await sendResendToMediaOwners({
      campaignId: payload.campaignId,
      title: payload.title,
      budgetKrw: payload.budgetKrw,
      mediaIds: payload.mediaIds,
    });
  } catch (e) {
    console.error("[campaign] notify media owners failed", e);
  }

}
