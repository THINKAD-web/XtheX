"use server";

import { MediaStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";
import { revalidateMediaReviewSurfaces } from "@/lib/admin/revalidate-media-public";
import type { MediaReviewFormPayload } from "@/lib/media/media-review-form-payload";
import {
  getMediaUpdateDataFromReviewPayload,
  validateMediaReviewPayload,
} from "@/lib/media/persist-media-review-payload";
import type { MediaDraftForReviewClient } from "@/app/[locale]/admin/review/[mediaId]/actions";

export type OwnerReviewResult = { ok: true } | { ok: false; error: string };

export async function getOwnerMediaDraftForReview(
  mediaId: string,
): Promise<
  { ok: true; media: MediaDraftForReviewClient } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MEDIA_OWNER) {
    return { ok: false, error: "권한이 없습니다." };
  }

  const media = await prisma.media.findFirst({
    where: { id: mediaId, createdById: user.id },
    include: {
      createdBy: { select: { id: true, email: true, name: true } },
    },
  });

  if (!media) {
    return { ok: false, error: "매체를 찾을 수 없습니다." };
  }

  if (media.status !== MediaStatus.PENDING) {
    return {
      ok: false,
      error: "승인 대기(PENDING) 상태의 매체만 이 화면에서 편집할 수 있습니다.",
    };
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
      parseHistory: (media.parseHistory as object | null) ?? null,
      status: media.status,
      adminMemo: media.adminMemo,
      createdBy: media.createdBy,
    },
  };
}

export async function saveOwnerPendingMedia(
  mediaId: string,
  payload: MediaReviewFormPayload,
): Promise<OwnerReviewResult> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.MEDIA_OWNER) {
      return { ok: false, error: "권한이 없습니다." };
    }

    const existing = await prisma.media.findFirst({
      where: { id: mediaId, createdById: user.id },
      select: { id: true, status: true },
    });
    if (!existing) {
      return { ok: false, error: "매체를 찾을 수 없습니다." };
    }
    if (existing.status !== MediaStatus.PENDING) {
      return {
        ok: false,
        error: "승인 대기 중인 매체만 수정할 수 있습니다.",
      };
    }

    const err = validateMediaReviewPayload(payload);
    if (err) return { ok: false, error: err };

    await prisma.media.update({
      where: { id: mediaId },
      data: getMediaUpdateDataFromReviewPayload(payload, MediaStatus.PENDING),
    });

    revalidatePath("/dashboard/media-owner");
    revalidatePath("/dashboard/media-owner/medias");
    revalidatePath(`/dashboard/media-owner/medias/${mediaId}/review`);
    revalidatePath("/admin/medias");
    return { ok: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "저장에 실패했습니다.";
    return { ok: false, error: message };
  }
}

/**
 * 매체사가 최종 등록을 제출했음을 기록하고 상태를 PENDING으로 확정합니다.
 * (폼 데이터는 먼저 saveOwnerPendingMedia로 저장한 뒤 호출하는 것을 권장합니다.)
 */
export async function submitForReview(mediaId: string): Promise<OwnerReviewResult> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.MEDIA_OWNER) {
      return { ok: false, error: "권한이 없습니다." };
    }

    const existing = await prisma.media.findFirst({
      where: { id: mediaId, createdById: user.id },
      select: { id: true, status: true, parseHistory: true },
    });
    if (!existing) {
      return { ok: false, error: "매체를 찾을 수 없습니다." };
    }
    if (existing.status !== MediaStatus.PENDING) {
      return {
        ok: false,
        error: "승인 대기(PENDING) 상태의 매체만 최종 등록 신청할 수 있습니다.",
      };
    }

    const prev =
      existing.parseHistory &&
      typeof existing.parseHistory === "object" &&
      !Array.isArray(existing.parseHistory)
        ? (existing.parseHistory as Record<string, unknown>)
        : {};

    const nextHistory: Prisma.InputJsonValue = {
      ...prev,
      ownerSubmittedForReviewAt: new Date().toISOString(),
    };

    await prisma.media.update({
      where: { id: mediaId },
      data: {
        status: MediaStatus.PENDING,
        parseHistory: nextHistory,
      },
    });

    revalidatePath("/dashboard/media-owner");
    revalidatePath("/dashboard/media-owner/medias");
    revalidatePath(`/dashboard/media-owner/medias/${mediaId}/review`);
    revalidatePath("/admin/medias");
    revalidateMediaReviewSurfaces(mediaId);
    return { ok: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "최종 등록 신청에 실패했습니다.";
    return { ok: false, error: message };
  }
}
