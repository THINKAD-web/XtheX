import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/campaign/api-auth";
import {
  campaignSaveBodySchema,
  type CampaignSaveBody,
} from "@/lib/campaign/save-body-schema";

export const runtime = "nodejs";

function targetSummary(p: CampaignSaveBody["parse"]): string {
  const t = p.target;
  const parts = [
    t.age_band,
    t.gender,
    t.lifestyle_notes,
    p.audience_tags.slice(0, 6).join(", "),
  ].filter(Boolean);
  return parts.join(" · ").slice(0, 2000) || "—";
}

function locationSummary(p: CampaignSaveBody["parse"]): string {
  const loc = p.location_keywords.join(", ");
  return (loc || "—").slice(0, 1000);
}

export async function POST(req: Request) {
  const authz = await requireDbUser();
  if (!authz.ok) {
    return NextResponse.json(
      { ok: false, error: authz.message },
      { status: authz.status },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON 본문이 필요합니다." },
      { status: 400 },
    );
  }

  const parsed = campaignSaveBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "입력 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { parse: mixParse, proposal } = parsed.data;
  const date = new Date();
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const title =
    parsed.data.title?.trim() ||
    `캠페인 - ${dateStr}`;

  const mediaMix = {
    proposalId: proposal.id,
    media_ids: proposal.media_ids,
    total_cost: proposal.total_cost_krw,
    estimated_reach: proposal.estimated_reach,
    breakdown: proposal.breakdown,
    reasoning_ko: proposal.reasoning_ko ?? null,
  };

  const campaign = await prisma.campaign.create({
    data: {
      userId: authz.userId,
      title,
      status: "DRAFT",
      budget_krw: mixParse.budget_krw,
      duration_weeks: mixParse.duration_weeks,
      target_summary: targetSummary(mixParse),
      location_summary: locationSummary(mixParse),
      mediaMix,
      parseSnapshot: mixParse as object,
    },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  return NextResponse.json({
    ok: true,
    campaign: {
      id: campaign.id,
      title: campaign.title,
      status: campaign.status,
      createdAt: campaign.createdAt.toISOString(),
    },
  });
}
