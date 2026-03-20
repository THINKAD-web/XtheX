import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { MediaStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  extractAllMediaFromProposalPdf,
  toMediaCreateInput,
} from "@/lib/ai/extract-media-from-proposal";
import {
  LOCAL_PROPOSAL_PREFIX,
  saveUploadedProposalFile,
} from "@/lib/admin/proposal-local-storage";
import { enrichExtractedMediaData } from "@/lib/admin/enrich-extracted-media";
import type { UploadDraftPreview } from "@/lib/admin/upload-draft-preview";
import type { UserMediaSamplesResult } from "@/lib/admin/process-user-media-samples";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const ALLOWED_EXT = [".pdf", ".ppt", ".pptx"];
const MAX_BYTES = 50 * 1024 * 1024;

/**
 * DB/Prisma 클라이언트에 sampleDescriptions·sampleImages·audienceTags 컬럼이
 * 없거나 구버전일 때도 초안 생성이 되도록, 코어 컬럼만 사용하고 나머지는 병합.
 */
function buildMediaDraftCreatePayload(
  input: ReturnType<typeof toMediaCreateInput>,
  createdById: string,
): Prisma.MediaUncheckedCreateInput {
  const sampleDescs = input.sampleDescriptions ?? [];
  const sampleImgs = input.sampleImages ?? [];
  const audTags = input.audienceTags ?? [];
  const descParts: string[] = [];
  if (input.description?.trim()) descParts.push(input.description.trim());
  if (sampleDescs.length) {
    descParts.push(
      sampleDescs
        .map((d, i) => `[매체 샘플 ${i + 1}] ${d}`)
        .join("\n"),
    );
  }
  const tags = [...new Set([...(input.tags ?? []), ...audTags])];
  const images = [...(input.images ?? []), ...sampleImgs];

  return {
    mediaName: input.mediaName,
    category: input.category,
    description: descParts.length ? descParts.join("\n\n") : null,
    locationJson: input.locationJson as Prisma.InputJsonValue,
    price: input.price,
    cpm: input.cpm,
    exposureJson:
      input.exposureJson === undefined || input.exposureJson === null
        ? Prisma.JsonNull
        : (input.exposureJson as Prisma.InputJsonValue),
    targetAudience: input.targetAudience,
    images,
    tags,
    pros: input.pros,
    cons: input.cons,
    trustScore: input.trustScore,
    proposalFileUrl: input.proposalFileUrl,
    adminMemo: input.adminMemo,
    status: MediaStatus.DRAFT,
    createdById,
  };
}

function isAllowedFile(file: File): { ok: true } | { ok: false; error: string } {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!ALLOWED_EXT.includes(ext)) {
    return { ok: false, error: "PDF, PPT, PPTX만 업로드 가능합니다." };
  }
  if (!ALLOWED_TYPES.includes(file.type) && !ext) {
    return { ok: false, error: "지원하지 않는 파일 형식입니다." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "파일 크기는 50MB 이하여야 합니다." };
  }
  return { ok: true };
}

export type { UploadDraftPreview } from "@/lib/admin/upload-draft-preview";

export type UploadProposalResult =
  | {
      success: true;
      draftIds: string[];
      draftId: string;
      previews: UploadDraftPreview[];
      failed?: { name: string; error: string }[];
    }
  | { success: false; error: string };

function mapLlmAndExtractErrors(msg: string): string | null {
  if (
    msg.includes("clerkMiddleware") ||
    msg.includes("auth-middleware")
  ) {
    return "로그인 인증 경로 오류입니다. 프로젝트 루트에 proxy.ts(Clerk)가 있는지 확인하고 dev 서버를 재시작해 주세요.";
  }
  if (msg.startsWith("EXTRACT:")) {
    return msg.replace(/^EXTRACT:/, "").trim();
  }
  if (
    msg.includes("OpenAI API") ||
    msg.includes("xAI Grok") ||
    msg.includes("Groq API") ||
    msg.includes("Grok 응답") ||
    msg.includes("Groq 응답")
  ) {
    if (msg.includes("Model not found")) {
      return `${msg}\n\n→ .env.local 에 XAI_MODEL=grok-3 또는 grok-4 (console.x.ai Models 참고) 후 서버 재시작. 구버전 grok-2-latest 는 폐기됨.`;
    }
    if (
      msg.includes("403") &&
      (msg.includes("credits") ||
        msg.includes("licenses") ||
        msg.includes("does not have permission"))
    ) {
      return (
        "xAI(Grok) 팀에 결제된 크레딧·라이선스가 없어 API 호출이 거절됐습니다.\n\n" +
        "① console.x.ai 에서 해당 팀에 크레딧/플랜을 추가하거나,\n" +
        "② 당분간 Groq 무료 티어로 쓰려면 .env.local 에 GROQ_API_KEY=gsk_… 를 넣고 xAI 키는 비우거나 주석 처리한 뒤 서버를 재시작하세요."
      );
    }
    return msg;
  }
  return null;
}

function parseUserMediaSamplesFromForm(
  formData: FormData,
): UserMediaSamplesResult | null {
  const raw = formData.get("userMediaSamples");
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const p = JSON.parse(raw) as {
      urls?: unknown;
      descriptions?: unknown;
      descriptionExtras?: unknown;
    };
    if (!Array.isArray(p.urls) || !Array.isArray(p.descriptions)) return null;
    const urls = p.urls.map(String).filter(Boolean);
    const descArr = p.descriptions as string[];
    const descriptions = urls.map((_, i) => String(descArr[i] ?? ""));
    const descriptionExtras =
      typeof p.descriptionExtras === "string" ? p.descriptionExtras : "";
    if (!urls.length && !descriptionExtras.trim()) return null;
    return {
      urls,
      descriptions: urls.length ? descriptions.slice(0, urls.length) : [],
      descriptionExtras,
      warnings: [],
    };
  } catch {
    return null;
  }
}

async function createDraftsFromProposalFile(
  file: File,
  adminMemo: string | undefined,
  dbUserId: string,
  userMediaAugment: UserMediaSamplesResult | null,
): Promise<UploadDraftPreview[]> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const items = await extractAllMediaFromProposalPdf(
    buffer,
    adminMemo,
    file.name,
  );
  if (!items.length) {
    throw new Error("EXTRACT:추출된 매체 항목이 없습니다.");
  }

  const previews: UploadDraftPreview[] = [];
  const total = items.length;

  for (let idx = 0; idx < items.length; idx++) {
    let extracted = { ...items[idx] };
    if (total > 1 && !extracted.media_name.match(/\(\d+\/\d+\)/)) {
      extracted = {
        ...extracted,
        media_name: `${extracted.media_name} (${idx + 1}/${total})`,
      };
    }
    if (userMediaAugment) {
      if (userMediaAugment.urls.length > 0) {
        extracted.sampleImages = [
          ...(extracted.sampleImages ?? []),
          ...userMediaAugment.urls,
        ];
        extracted.sampleDescriptions = [
          ...(extracted.sampleDescriptions ?? []),
          ...userMediaAugment.descriptions.slice(0, userMediaAugment.urls.length),
        ];
      }
      if (userMediaAugment.descriptionExtras?.trim()) {
        extracted.description = [
          extracted.description,
          userMediaAugment.descriptionExtras.trim(),
        ]
          .filter(Boolean)
          .join("\n\n");
      }
      if (userMediaAugment.urls.length && userMediaAugment.descriptions.length) {
        const block = userMediaAugment.descriptions
          .slice(0, userMediaAugment.urls.length)
          .map((d, i) => `[업로드 매체 사진 ${i + 1}] ${d}`)
          .join("\n");
        extracted.description = [extracted.description, block]
          .filter(Boolean)
          .join("\n\n");
      }
    }

    extracted = await enrichExtractedMediaData(extracted);

    const createInput = toMediaCreateInput(extracted, {
      adminMemo: adminMemo ?? null,
      createdById: dbUserId,
      proposalFileUrl: null,
    });

    const media = await prisma.media.create({
      data: buildMediaDraftCreatePayload(createInput, dbUserId),
    });

    try {
      await saveUploadedProposalFile(media.id, buffer, file.name);
      await prisma.media.update({
        where: { id: media.id },
        data: { proposalFileUrl: `${LOCAL_PROPOSAL_PREFIX}${media.id}` },
      });
    } catch (e) {
      console.error(
        `[upload-proposal] 파일 저장 실패 media=${media.id}:`,
        e,
      );
      throw e;
    }

    revalidatePath(`/admin/review/${media.id}`);
    previews.push({
      draftId: media.id,
      mediaName: extracted.media_name,
      category: extracted.category,
      trustScore: extracted.trust_score ?? null,
      description: extracted.description ?? null,
      tags: extracted.tags ?? [],
      address: extracted.location?.address ?? null,
      district: extracted.location?.district ?? null,
      price: extracted.price ?? null,
      cpm: extracted.cpm ?? null,
    });
  }

  console.log(
    `[upload-proposal] ${file.name}: ${total}건 초안 생성 →`,
    previews.map((p) => p.draftId).join(", "),
  );
  return previews;
}

export async function runUploadProposalFromFormData(
  formData: FormData,
): Promise<UploadProposalResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const { findUserByClerkId } = await import("@/lib/auth/find-user-by-clerk");
    const dbUser = await findUserByClerkId(userId);
    if (!dbUser) {
      return { success: false, error: "사용자 정보를 찾을 수 없습니다." };
    }

    const rawFiles = formData.getAll("files") as File[];
    const files = rawFiles.filter((f): f is File => f instanceof File);
    const adminMemo =
      (formData.get("adminMemo") as string)?.trim() || undefined;
    const userMediaAugment = parseUserMediaSamplesFromForm(formData);

    if (!files.length) {
      return { success: false, error: "업로드할 파일을 선택해 주세요." };
    }

    const draftIds: string[] = [];
    const previews: UploadDraftPreview[] = [];
    const failed: { name: string; error: string }[] = [];

    for (const file of files) {
      const check = isAllowedFile(file);
      if (!check.ok) {
        failed.push({ name: file.name, error: check.error });
        continue;
      }
      try {
        const batch = await createDraftsFromProposalFile(
          file,
          adminMemo,
          dbUser.id,
          userMediaAugment,
        );
        for (const preview of batch) {
          draftIds.push(preview.draftId);
          previews.push(preview);
        }
      } catch (e) {
        console.error(`upload-proposal failed for ${file.name}:`, e);
        const msg = e instanceof Error ? e.message : String(e);
        const friendly = mapLlmAndExtractErrors(msg);
        const errOut =
          friendly != null && friendly !== ""
            ? friendly
            : msg
              ? msg
              : "처리 실패";
        failed.push({ name: file.name, error: errOut });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/ai-upload");
    revalidatePath("/admin/medias");

    if (draftIds.length === 0) {
      const errLines = failed.map((f) => `• ${f.name}: ${f.error}`);
      return {
        success: false,
        error:
          failed.length === 1
            ? failed[0].error
            : `모든 파일 처리에 실패했습니다.\n${errLines.join("\n")}`,
      };
    }

    return {
      success: true,
      draftIds,
      draftId: draftIds[0],
      previews,
      ...(failed.length ? { failed } : {}),
    };
  } catch (e) {
    console.error("runUploadProposalFromFormData error:", e);
    const msg = e instanceof Error ? e.message : "";
    const mapped = mapLlmAndExtractErrors(msg);
    if (mapped) {
      return { success: false, error: mapped };
    }
    return {
      success: false,
      error:
        "업로드 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
