import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isLocalProposalUrl,
  readUploadedProposalFile,
} from "@/lib/admin/proposal-local-storage";
import type { ExtractedMediaData } from "@/lib/ai/extract-media-from-proposal";
import type { MediaReviewFormPayload } from "@/lib/media/media-review-form-payload";

export type { MediaReviewFormPayload };

export type ReparseRequestHints = {
  address?: string;
  district?: string;
  city?: string;
};

export type ReparseFormSnapshot = {
  mediaName?: string;
  description?: string | null;
  category?: string;
  price?: number | null;
  cpm?: number | null;
  targetAudience?: string | null;
  tags?: string[];
  pros?: string | null;
};

function toIntOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && !Number.isNaN(v)) return Math.round(v);
  const cleaned = String(v).replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : Math.round(n);
}

function extractedToPayload(extracted: ExtractedMediaData): MediaReviewFormPayload {
  const loc = extracted.location ?? {};
  return {
    mediaName: extracted.media_name,
    description: extracted.description ?? null,
    category: extracted.category,
    subCategory: extracted.sub_category ?? null,
    locationJson: {
      address: loc.address ?? null,
      district: loc.district ?? null,
      city: (loc as { city?: string | null }).city ?? null,
      lat: loc.lat ?? null,
      lng: loc.lng ?? null,
      map_link: loc.map_link ?? null,
    },
    price: toIntOrNull(extracted.price),
    priceNote: extracted.price_note ?? null,
    widthM: extracted.width_m ?? null,
    heightM: extracted.height_m ?? null,
    resolution: extracted.resolution ?? null,
    operatingHours: extracted.operating_hours ?? null,
    dailyFootfall: extracted.daily_footfall ?? toIntOrNull(extracted.exposure?.daily_traffic),
    weekdayFootfall: extracted.weekday_footfall ?? null,
    targetAge: extracted.target_age ?? null,
    impressions:
      extracted.impressions ?? toIntOrNull(extracted.exposure?.monthly_impressions),
    reach: extracted.reach ?? toIntOrNull(extracted.exposure?.reach),
    frequency: extracted.frequency ?? toIntOrNull(extracted.exposure?.frequency),
    cpm: toIntOrNull(extracted.cpm),
    engagementRate: extracted.engagement_rate ?? null,
    visibilityScore: extracted.visibility_score ?? null,
    effectMemo: extracted.effect_memo ?? null,
    exposureJson: extracted.exposure
      ? {
          daily_traffic: extracted.exposure.daily_traffic ?? null,
          monthly_impressions: extracted.exposure.monthly_impressions ?? null,
          reach: extracted.exposure.reach ?? null,
          frequency: extracted.exposure.frequency ?? null,
        }
      : null,
    targetAudience: extracted.target_audience ?? null,
    images: extracted.images ?? [],
    tags: extracted.tags ?? [],
    audienceTags: extracted.audience_tags ?? [],
    pros: extracted.pros ?? null,
    cons: extracted.cons ?? null,
    trustScore: extracted.trust_score ?? null,
    sampleImages: extracted.sampleImages ?? [],
    sampleDescriptions: extracted.sampleDescriptions ?? [],
    extractedImages: extracted.extracted_images ?? extracted.images ?? [],
  };
}

function buildReparseUserBlock(
  hints: ReparseRequestHints | undefined,
  snapshot: ReparseFormSnapshot | undefined,
): string {
  const lines: string[] = [
    "【검토 화면에서 입력·수정된 값 — 주소 보강에 최우선 반영. PDF 본문과 다르면 본문 우선, 이 블록은 힌트로 사용】",
  ];
  if (hints?.address?.trim()) {
    lines.push(`검토자 입력 주소(full_address 후보): ${hints.address.trim()}`);
  }
  if (hints?.district?.trim()) {
    lines.push(`검토자 입력 구/군(district): ${hints.district.trim()}`);
  }
  if (hints?.city?.trim()) {
    lines.push(`검토자 입력 시/도(city): ${hints.city.trim()}`);
  }
  if (snapshot) {
    lines.push("【현재 폼 스냅샷(재추출 시 매체명·가격 등 일관성 참고)】");
    if (snapshot.mediaName) lines.push(`미디어명: ${snapshot.mediaName}`);
    if (snapshot.description) {
      lines.push(
        `설명 앞부분: ${String(snapshot.description).slice(0, 600)}`,
      );
    }
    if (snapshot.category) lines.push(`카테고리: ${snapshot.category}`);
    if (snapshot.price != null) lines.push(`가격(원): ${snapshot.price}`);
    if (snapshot.cpm != null) lines.push(`CPM: ${snapshot.cpm}`);
    if (snapshot.targetAudience) {
      lines.push(`타깃: ${snapshot.targetAudience.slice(0, 200)}`);
    }
    if (snapshot.tags?.length) {
      lines.push(`태그: ${snapshot.tags.slice(0, 20).join(", ")}`);
    }
    if (snapshot.pros) lines.push(`장점: ${snapshot.pros.slice(0, 200)}`);
  }
  return lines.join("\n");
}

export type RunReparseResult =
  | { ok: true; payload: MediaReviewFormPayload }
  | { ok: false; error: string };

export type RunReparseOptions = {
  hints?: ReparseRequestHints;
  formSnapshot?: ReparseFormSnapshot;
};

/**
 * Node.js에서만 호출 (fs로 로컬 PDF 읽음).
 * 재파싱 전 parseSnapshot에 이전 추출 결과 백업.
 */
export async function runReparseProposalForMediaId(
  mediaId: string,
  options?: RunReparseOptions,
): Promise<RunReparseResult> {
  try {
    const [{ extractMediaFromProposal, ExtractedMediaDataZod }, { enrichExtractedMediaData }] =
      await Promise.all([
        import("@/lib/ai/extract-media-from-proposal"),
        import("@/lib/admin/enrich-extracted-media"),
      ]);
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      return { ok: false, error: "미디어를 찾을 수 없습니다." };
    }

    let buffer: Buffer;
    let proposalFileName: string;

    if (isLocalProposalUrl(media.proposalFileUrl)) {
      const local = await readUploadedProposalFile(mediaId);
      if (!local) {
        return {
          ok: false,
          error:
            "저장된 원본 PDF를 찾을 수 없습니다. 프로젝트 폴더의 .data/proposals/ 를 확인하거나, AI 업로드로 PDF를 다시 올려 주세요.",
        };
      }
      buffer = local.buffer;
      proposalFileName = local.fileName;
    } else if (media.proposalFileUrl?.startsWith("http")) {
      const res = await fetch(media.proposalFileUrl);
      if (!res.ok) {
        return {
          ok: false,
          error: `원본 파일을 가져오지 못했습니다. (HTTP ${res.status})`,
        };
      }
      buffer = Buffer.from(await res.arrayBuffer());
      proposalFileName =
        media.proposalFileUrl.split("/").pop()?.split("?")[0] || "proposal.pdf";
    } else {
      const local = await readUploadedProposalFile(mediaId);
      if (local) {
        buffer = local.buffer;
        proposalFileName = local.fileName;
      } else {
        return {
          ok: false,
          error:
            "원본 제안서가 없습니다. AI 업로드로 PDF를 다시 올리면 재파싱할 수 있습니다.",
        };
      }
    }

    const backup = {
      type: "reparse_backup",
      at: new Date().toISOString(),
      previous: {
        mediaName: media.mediaName,
        description: media.description,
        locationJson: media.locationJson,
        price: media.price,
        cpm: media.cpm,
        exposureJson: media.exposureJson,
        targetAudience: media.targetAudience,
        tags: media.tags,
        pros: media.pros,
        trustScore: media.trustScore,
      },
    };
    const prevSnap = media.parseHistory as
      | { backups?: unknown[] }
      | null
      | undefined;
    const prevBackups = Array.isArray(prevSnap?.backups)
      ? prevSnap.backups
      : [];
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        parseHistory: {
          backups: [...prevBackups, backup].slice(-8),
          lastReparseAt: backup.at,
        } as Prisma.InputJsonValue,
      },
    });

    const extraUserBlock = buildReparseUserBlock(
      options?.hints,
      options?.formSnapshot,
    );

    let extractedRaw = await extractMediaFromProposal(
      buffer,
      media.adminMemo ?? undefined,
      proposalFileName,
      {
        extraUserBlock,
        reparse: true,
      },
    );
    extractedRaw = await enrichExtractedMediaData(extractedRaw);

    const parsed = ExtractedMediaDataZod.safeParse(extractedRaw);
    if (!parsed.success) {
      return {
        ok: false,
        error: "재파싱 결과 검증 실패: " + parsed.error.message,
      };
    }

    return { ok: true, payload: extractedToPayload(parsed.data) };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "재파싱 처리 중 오류가 발생했습니다.";
    return { ok: false, error: message };
  }
}
