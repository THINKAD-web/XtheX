"use server";

import { MediaStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";
import { revalidateMediaReviewSurfaces } from "@/lib/admin/revalidate-media-public";
import type { MediaReviewFormPayload } from "@/lib/media/media-review-form-payload";
import {
  getMediaUpdateDataFromReviewPayload,
  validateMediaReviewPayload,
} from "@/lib/media/persist-media-review-payload";

export type { MediaReviewFormPayload } from "@/lib/media/media-review-form-payload";

async function requireAdminAndMedia(mediaId: string) {
  const dbUser = await getCurrentUser();
  if (!dbUser) throw new Error("Unauthorized");
  if (dbUser.role !== UserRole.ADMIN) throw new Error("Forbidden");
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
  parseHistory: object | null;
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
        parseHistory: (media.parseHistory as object | null) ?? null,
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

export type UpdateResult = { ok: true } | { ok: false; error: string };

export async function updateMediaDraft(
  mediaId: string,
  payload: MediaReviewFormPayload,
): Promise<UpdateResult> {
  try {
    await requireAdminAndMedia(mediaId);
    const err = validateMediaReviewPayload(payload);
    if (err) return { ok: false, error: err };

    await prisma.media.update({
      where: { id: mediaId },
      data: getMediaUpdateDataFromReviewPayload(payload),
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
  payload: MediaReviewFormPayload,
): Promise<UpdateResult> {
  try {
    await requireAdminAndMedia(mediaId);
    const err = validateMediaReviewPayload(payload);
    if (err) return { ok: false, error: err };

    await prisma.media.update({
      where: { id: mediaId },
      data: getMediaUpdateDataFromReviewPayload(payload, MediaStatus.PUBLISHED),
    });

    revalidatePath("/admin");
    revalidatePath("/admin/medias");
    revalidatePath(`/admin/review/${mediaId}`);
    revalidatePath("/admin/ai-upload");
    revalidateMediaReviewSurfaces(mediaId);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "공개 처리에 실패했습니다.";
    return { ok: false, error: message };
  }
}
