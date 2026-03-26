import { NextResponse } from "next/server";
import { MediaStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/find-user-by-clerk";
import { revalidatePath } from "next/cache";
import {
  extractAllMediaFromProposalPdf,
  toMediaCreateInput,
} from "@/lib/ai/extract-media-from-proposal";

export const runtime = "nodejs";
export const maxDuration = 180;

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXT = [".pdf", ".ppt", ".pptx"];

function extOf(name: string) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await findUserById(session.user.id);
  if (!dbUser || dbUser.role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid multipart body" },
      { status: 400 },
    );
  }

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json(
      { ok: false, error: "업로드할 제안서를 선택해 주세요." },
      { status: 400 },
    );
  }

  const mediaIds: string[] = [];

  for (const file of files) {
    const ext = extOf(file.name);
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json(
        { ok: false, error: "PDF, PPT, PPTX만 업로드 가능합니다." },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "파일 크기는 50MB 이하여야 합니다." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedItems = await extractAllMediaFromProposalPdf(
      buffer,
      "media-owner-ai-upload",
      file.name,
    );
    if (!extractedItems.length) continue;

    for (const extracted of extractedItems) {
      const createInput = toMediaCreateInput(extracted, {
        createdById: dbUser.id,
        proposalFileUrl: null,
        adminMemo: "media-owner-ai-upload",
      });

      const media = await prisma.media.create({
        data: {
          ...createInput,
          images: (createInput.images ?? []).slice(0, 10),
          sampleImages: (createInput.sampleImages ?? []).slice(0, 10),
          sampleDescriptions: (createInput.sampleDescriptions ?? []).slice(0, 10),
          tags: [...new Set([...(createInput.tags ?? []), "media-owner-ai-upload"])],
          status: MediaStatus.PENDING,
          createdById: dbUser.id,
        },
        select: { id: true },
      });
      mediaIds.push(media.id);
    }
  }

  if (mediaIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "추출된 매체가 없습니다. 제안서 내용을 확인해 주세요." },
      { status: 400 },
    );
  }

  revalidatePath("/dashboard/media-owner");
  revalidatePath("/dashboard/media-owner/medias");
  revalidatePath("/admin/medias");

  return NextResponse.json({
    ok: true,
    mediaIds,
    firstMediaId: mediaIds[0],
  });
}

