import { notFound, redirect } from "next/navigation";
import type { MediaCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import { CampaignDetailClient } from "@/components/campaigns/CampaignDetailClient";
import { getOmniMediaCategory } from "@/lib/omni-cart/category";
import type { OmniCartItem } from "@/lib/omni-cart/types";

export const runtime = "nodejs";

type MixJson = {
  type?: string;
  media_ids?: string[];
  total_cost?: number;
  estimated_reach?: number;
  estimated_floor_krw?: number;
  breakdown?: { category: string; count: number; pct: number }[];
  reasoning_ko?: string | null;
  items?: {
    id: string;
    mediaName: string;
    category?: string | null;
  }[];
};

function coordsFromLocationJson(
  j: unknown,
): { lat: number; lng: number; address: string | null } | null {
  if (!j || typeof j !== "object") return null;
  const o = j as Record<string, unknown>;
  const lat = Number(o.lat);
  const lng = Number(o.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const addr = [o.address, o.district]
    .filter((x) => typeof x === "string" && x.trim())
    .join(" ")
    .trim();
  return { lat, lng, address: addr || null };
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
  });

  if (!campaign) {
    notFound();
  }

  const mix = (campaign.mediaMix ?? {}) as MixJson;
  const mediaIds = Array.isArray(mix.media_ids) ? mix.media_ids : [];
  /** 옴니 상세: 배지·카테고리 아코디언·조합 기반 타임라인은 CampaignDetailClient에서 렌더 */
  const omniChannel =
    campaign.omniChannel === true || mix.type === "omni_channel";

  const mediasRaw = await prisma.media.findMany({
    where: { id: { in: mediaIds } },
    select: {
      id: true,
      mediaName: true,
      category: true,
      cpm: true,
      locationJson: true,
    },
  });

  const byId = new Map(mediasRaw.map((m) => [m.id, m]));

  const medias = mediaIds.map((mid) => {
    const m = byId.get(mid);
    if (m) {
      const ll = coordsFromLocationJson(m.locationJson);
      return {
        id: m.id,
        mediaName: m.mediaName,
        category: m.category as string,
        cpm: m.cpm,
        lat: ll?.lat ?? null,
        lng: ll?.lng ?? null,
        address: ll?.address ?? null,
      };
    }
    const snap = mix.items?.find((i) => i.id === mid);
    const cat = getOmniMediaCategory({
      id: mid,
      mediaName: snap?.mediaName ?? mid,
      category: snap?.category ?? undefined,
      priceMin: null,
      priceMax: null,
    } as OmniCartItem);
    const prismaCat: MediaCategory =
      cat === "UNKNOWN" ? "ETC" : (cat as MediaCategory);
    return {
      id: mid,
      mediaName: snap?.mediaName ?? `매체 ${mid.slice(0, 8)}…`,
      category: prismaCat,
      cpm: null as number | null,
      lat: null as number | null,
      lng: null as number | null,
      address: null as string | null,
    };
  });

  const omniFloor =
    typeof mix.estimated_floor_krw === "number"
      ? mix.estimated_floor_krw
      : 0;

  return (
    <CampaignDetailClient
      title={campaign.title}
      status={campaign.status}
      budget_krw={campaign.budget_krw}
      duration_weeks={campaign.duration_weeks}
      target_summary={campaign.target_summary}
      location_summary={campaign.location_summary}
      total_cost={mix.total_cost ?? 0}
      estimated_reach={mix.estimated_reach ?? 0}
      breakdown={mix.breakdown ?? []}
      reasoning_ko={mix.reasoning_ko ?? null}
      medias={medias}
      omniChannel={omniChannel}
      omniMediaCount={mediaIds.length}
      omniFloorKrw={omniFloor}
    />
  );
}
