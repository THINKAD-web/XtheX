"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { findUserByClerkId } from "@/lib/auth/find-user-by-clerk";
import { MediaStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { mergeAudienceTagsForStorage } from "@/lib/media/audience-tags";
export type MediaReviewFormPayload = {
  mediaName: string;
  description: string | null;
  category: string;
  locationJson: {
    address?: string | null;
    district?: string | null;
    city?: string | null;
    lat?: number | null;
    lng?: number | null;
    map_link?: string | null;
  };
  price: number | null;
  cpm: number | null;
  exposureJson: {
    daily_traffic?: number | string | null;
    monthly_impressions?: number | string | null;
    reach?: number | string | null;
    frequency?: number | string | null;
  } | null;
  targetAudience: string | null;
  images: string[];
  tags: string[];
  audienceTags: string[];
  pros: string | null;
  cons: string | null;
  trustScore: number | null;
  sampleImages: string[];
  sampleDescriptions: string[];
};

async function requireAdminAndMedia(mediaId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const dbUser = await findUserByClerkId(userId);
  if (!dbUser) throw new Error("Forbidden");
  const media = await prisma.media.findUniqueOrThrow({ where: { id: mediaId } });
  return { dbUser, media };
}

/** AI 업로드 등 클라이언트에서 검토 폼에 쓰는 직렬화 미디어 */
export type MediaDraftForReviewClient = {
  id: string;
  mediaName: string;
  category: string;
  description: string | null;
  locationJson: object;
  price: number | null;
  cpm: number | null;
  exposureJson: object | null;
  targetAudience: string | null;
  images: string[];
  tags: string[];
  audienceTags: string[];
  pros: string | null;
  cons: string | null;
  trustScore: number | null;
  sampleImages: string[];
  sampleDescriptions: string[];
  status: string;
  adminMemo: string | null;
  createdBy: { id: string; email: string; name: string | null } | null;
};

export async function getMediaDraftForReview(
  mediaId: string,
): Promise<
  { ok: true; media: MediaDraftForReviewClient } | { ok: false; error: string }
> {
  try {
    await requireAdminAndMedia(mediaId);
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });
    if (!media) {
      return { ok: false, error: "미디어를 찾을 수 없습니다." };
    }
    return {
      ok: true,
      media: {
        id: media.id,
        mediaName: media.mediaName,
        category: media.category,
        description: media.description,
        locationJson: (media.locationJson ?? {}) as object,
        price: media.price,
        cpm: media.cpm,
        exposureJson: media.exposureJson as object | null,
        targetAudience: media.targetAudience,
        images: media.images ?? [],
        tags: media.tags ?? [],
        audienceTags: media.audienceTags ?? [],
        pros: media.pros,
        cons: media.cons,
        trustScore: media.trustScore,
        sampleImages: media.sampleImages ?? [],
        sampleDescriptions: media.sampleDescriptions ?? [],
        status: media.status,
        adminMemo: media.adminMemo,
        createdBy: media.createdBy,
      },
    };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "불러오기에 실패했습니다.";
    return { ok: false, error: message };
  }
}

function toIntOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : Math.round(n);
}

export type UpdateResult = { ok: true } | { ok: false; error: string };

export async function updateMediaDraft(
  mediaId: string,
  payload: MediaReviewFormPayload
): Promise<UpdateResult> {
  try {
    await requireAdminAndMedia(mediaId);

    const exposure =
      payload.exposureJson &&
      (Object.keys(payload.exposureJson).length > 0 ||
        Object.values(payload.exposureJson).some((v) => v != null))
        ? (payload.exposureJson as object)
        : undefined;

    const audienceTagsMerged = mergeAudienceTagsForStorage(
      payload.targetAudience,
      payload.audienceTags,
    );
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        mediaName: payload.mediaName,
        description: payload.description ?? null,
        category: payload.category as "BILLBOARD" | "DIGITAL_BOARD" | "TRANSIT" | "STREET_FURNITURE" | "WALL" | "ETC",
        locationJson: payload.locationJson as object,
        price: toIntOrNull(payload.price),
        cpm: toIntOrNull(payload.cpm),
        exposureJson: exposure,
        targetAudience: payload.targetAudience ?? null,
        images: payload.images ?? [],
        tags: payload.tags ?? [],
        audienceTags: audienceTagsMerged,
        pros: payload.pros ?? null,
        cons: payload.cons ?? null,
        trustScore: payload.trustScore != null ? Math.min(100, Math.max(0, Math.round(payload.trustScore))) : null,
        sampleImages: payload.sampleImages ?? [],
        sampleDescriptions: payload.sampleDescriptions ?? [],
        status: MediaStatus.DRAFT,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/medias");
    revalidatePath(`/admin/review/${mediaId}`);
    revalidatePath("/admin/ai-upload");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "저장에 실패했습니다.";
    return { ok: false, error: message };
  }
}

export async function publishMedia(
  mediaId: string,
  payload: MediaReviewFormPayload
): Promise<UpdateResult> {
  try {
    await requireAdminAndMedia(mediaId);

    const exposure =
      payload.exposureJson &&
      (Object.keys(payload.exposureJson).length > 0 ||
        Object.values(payload.exposureJson).some((v) => v != null))
        ? (payload.exposureJson as object)
        : undefined;

    const audienceTagsMergedPub = mergeAudienceTagsForStorage(
      payload.targetAudience,
      payload.audienceTags,
    );
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        mediaName: payload.mediaName,
        description: payload.description ?? null,
        category: payload.category as "BILLBOARD" | "DIGITAL_BOARD" | "TRANSIT" | "STREET_FURNITURE" | "WALL" | "ETC",
        locationJson: payload.locationJson as object,
        price: toIntOrNull(payload.price),
        cpm: toIntOrNull(payload.cpm),
        exposureJson: exposure,
        targetAudience: payload.targetAudience ?? null,
        images: payload.images ?? [],
        tags: payload.tags ?? [],
        audienceTags: audienceTagsMergedPub,
        pros: payload.pros ?? null,
        cons: payload.cons ?? null,
        trustScore: payload.trustScore != null ? Math.min(100, Math.max(0, Math.round(payload.trustScore))) : null,
        sampleImages: payload.sampleImages ?? [],
        sampleDescriptions: payload.sampleDescriptions ?? [],
        status: MediaStatus.PUBLISHED,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/medias");
    revalidatePath(`/admin/review/${mediaId}`);
    revalidatePath("/admin/ai-upload");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "공개 처리에 실패했습니다.";
    return { ok: false, error: message };
  }
}
