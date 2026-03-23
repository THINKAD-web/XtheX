import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/campaign/api-auth";
import { revalidateCampaignListPages } from "@/lib/campaign/revalidate-campaign-lists";

export const runtime = "nodejs";

const bodySchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(200),
  budget_krw: z.coerce.number().int().min(1).max(1_000_000_000_000).optional(),
  duration_weeks: z.coerce.number().int().min(1).max(104).optional(),
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
    const msg = parsed.error.flatten().fieldErrors.title?.[0] ?? "입력을 확인해 주세요.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const budget_krw = parsed.data.budget_krw ?? 1_000_000;
  const duration_weeks = parsed.data.duration_weeks ?? 4;

  try {
    const campaign = await prisma.campaign.create({
      data: {
        userId: authz.userId,
        title: parsed.data.title,
        status: "DRAFT",
        budget_krw,
        duration_weeks,
        target_summary: "빠른 생성",
        location_summary: "—",
        mediaMix: { source: "quick_create", created_via: "api/campaign/quick" },
        omniChannel: false,
      },
      select: {
        id: true,
        title: true,
        status: true,
        budget_krw: true,
        duration_weeks: true,
        createdAt: true,
        omniChannel: true,
      },
    });

    revalidateCampaignListPages();

    return NextResponse.json({
      ok: true,
      campaign: {
        ...campaign,
        createdAt: campaign.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("[POST /api/campaign/quick]", e);
    return NextResponse.json(
      { ok: false, error: "캠페인을 만들지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
