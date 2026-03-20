import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/campaign/api-auth";
import { notifyCampaignSubmitted } from "@/lib/campaign/notify-submitted";

export const runtime = "nodejs";

const bodySchema = z.object({
  campaignId: z.string().uuid(),
});

export async function POST(req: Request) {
  const authz = await requireDbUser();
  if (!authz.ok) {
    return NextResponse.json(
      { ok: false, error: authz.message },
      { status: authz.status },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON 본문이 필요합니다." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "campaignId가 필요합니다." },
      { status: 400 },
    );
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: parsed.data.campaignId,
      userId: authz.userId,
    },
  });

  if (!campaign) {
    return NextResponse.json(
      { ok: false, error: "캠페인을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (campaign.status !== "DRAFT") {
    return NextResponse.json(
      {
        ok: false,
        error: `이미 처리된 캠페인입니다. (${campaign.status})`,
      },
      { status: 409 },
    );
  }

  const mix = campaign.mediaMix as {
    media_ids?: string[];
  };
  const mediaIds = Array.isArray(mix.media_ids) ? mix.media_ids : [];

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "SUBMITTED" },
  });

  await notifyCampaignSubmitted({
    campaignId: campaign.id,
    userId: authz.userId,
    mediaIds,
    budgetKrw: campaign.budget_krw,
    title: campaign.title?.trim() || "캠페인 제안",
  });

  return NextResponse.json({
    ok: true,
    campaign: { id: campaign.id, status: "SUBMITTED" as const },
  });
}
