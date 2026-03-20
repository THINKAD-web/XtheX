import { prisma } from "@/lib/prisma";

export type CampaignEventDaily = {
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  spend: number;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getCampaignEventSummaryForDraft(
  campaignDraftId: string,
  opts?: { days?: number },
): Promise<{
  today: { impressions: number; clicks: number; spend: number };
  series: CampaignEventDaily[];
}> {
  const days = Math.max(1, Math.min(30, opts?.days ?? 7));

  const delegate = (prisma as any).campaignEvent;
  if (!delegate?.findMany) {
    return {
      today: { impressions: 0, clicks: 0, spend: 0 },
      series: Array.from({ length: days }).map((_, i) => {
        const d = startOfDay(new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000));
        return { date: toYmd(d), impressions: 0, clicks: 0, spend: 0 };
      }),
    };
  }

  const now = new Date();
  const since = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
  const rows = await delegate.findMany({
    where: { campaignDraftId, occurredAt: { gte: since } },
    select: { occurredAt: true, impressions: true, clicks: true, spend: true },
  });

  const buckets = new Map<string, { impressions: number; clicks: number; spend: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(toYmd(d), { impressions: 0, clicks: 0, spend: 0 });
  }
  for (const r of rows as Array<{ occurredAt: Date; impressions: number; clicks: number; spend: number }>) {
    const key = toYmd(new Date(r.occurredAt));
    const b = buckets.get(key);
    if (!b) continue;
    b.impressions += r.impressions ?? 0;
    b.clicks += r.clicks ?? 0;
    b.spend += r.spend ?? 0;
  }

  const todayKey = toYmd(now);
  const today = buckets.get(todayKey) ?? { impressions: 0, clicks: 0, spend: 0 };
  const series = Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));

  return { today, series };
}

