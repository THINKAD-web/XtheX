import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUserForCampaign } from "@/lib/campaign/api-auth";
import { omniSubmitBodySchema } from "@/lib/campaign/omni-submit-schema";

export const runtime = "nodejs";

function floorEstimate(items: { priceMin?: number | null; priceMax?: number | null }[]): number {
  return items.reduce((s, it) => {
    const v =
      it.priceMin != null
        ? it.priceMin
        : it.priceMax != null
          ? it.priceMax
          : 0;
    return s + Math.max(0, v);
  }, 0);
}

export async function POST(req: Request) {
  const authz = await getOrCreateDbUserForCampaign();
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

  const parsed = omniSubmitBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const issue = first as { code?: string; validation?: string };
    const hint =
      issue?.code === "invalid_string" && issue?.validation === "uuid"
        ? "매체 ID가 올바른 UUID가 아닙니다. 탐색에서 다시 담아 주세요."
        : "입력 형식이 올바르지 않습니다.";
    return NextResponse.json({ ok: false, error: hint }, { status: 400 });
  }

  const { items, title, budget_krw, duration_weeks } = parsed.data;
  const media_ids = items.map((i) => i.id);
  const estimated_floor_krw = floorEstimate(items);

  const date = new Date();
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const defaultTitle = `옴니채널 캠페인 · ${dateStr}`;
  const budget =
    budget_krw ??
    Math.max(estimated_floor_krw, 1_000_000, Math.round(estimated_floor_krw * 1.1));

  const mediaMix = {
    type: "omni_channel" as const,
    media_ids,
    items: items.map((i) => ({
      id: i.id,
      mediaName: i.mediaName,
      category: i.category ?? null,
      priceMin: i.priceMin ?? null,
      priceMax: i.priceMax ?? null,
      source: i.source ?? null,
    })),
    estimated_floor_krw,
    created_via: "omni_cart_local",
  };

  try {
    const campaign = await prisma.campaign.create({
      data: {
        userId: authz.userId,
        title: title?.trim() || defaultTitle,
        status: "DRAFT",
        budget_krw: budget,
        duration_weeks: duration_weeks ?? 4,
        target_summary: `옴니채널 다매체 제안 · 매체 ${items.length}개`,
        location_summary: items
          .map((i) => i.mediaName)
          .slice(0, 8)
          .join(", ")
          .slice(0, 1000),
        mediaMix,
        omniChannel: true,
        omniMediaIds: media_ids,
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
  } catch (e) {
    console.error("[omni-submit]", e);
    const msg =
      e instanceof Error && e.message.includes("Unique")
        ? "이미 동일한 요청이 처리 중일 수 있습니다."
        : "캠페인 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
