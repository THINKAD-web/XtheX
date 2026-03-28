import type { Campaign } from "@prisma/client";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function computeCampaignEndAt(campaign: Pick<Campaign, "createdAt" | "duration_weeks">): Date {
  const weeks = Math.max(1, campaign.duration_weeks);
  return new Date(campaign.createdAt.getTime() + weeks * MS_PER_WEEK);
}
