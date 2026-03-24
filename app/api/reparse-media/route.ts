import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { findUserById } from "@/lib/auth/find-user-by-clerk";
import { getAuthSession } from "@/lib/auth/session";
import {
  runReparseProposalForMediaId,
  type ReparseFormSnapshot,
  type ReparseRequestHints,
} from "@/lib/admin/run-reparse-proposal";

export const runtime = "nodejs";

/**
 * 재파싱 API: draftId(mediaId) + 수정된 폼 데이터로 PDF/원본 기반 재추출.
 * 검토 페이지 "주소 수정 후 재파싱"에서 호출.
 */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const dbUser = await findUserById(session.user.id);
    if (!dbUser || dbUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { ok: false, error: "권한이 없습니다." },
        { status: 403 },
      );
    }

    const body = (await req.json()) as {
      draftId?: string;
      mediaId?: string;
      updatedData?: {
        locationJson?: { address?: string; district?: string; city?: string };
        mediaName?: string;
        description?: string | null;
        category?: string;
        price?: number | null;
        cpm?: number | null;
        targetAudience?: string | null;
        tags?: string[];
        pros?: string | null;
      };
    };
    const mediaId =
      (typeof body.draftId === "string" ? body.draftId : null) ||
      (typeof body.mediaId === "string" ? body.mediaId : null) ||
      "";
    const updated = body.updatedData;

    if (!mediaId.trim()) {
      return NextResponse.json(
        { ok: false, error: "draftId 또는 mediaId가 필요합니다." },
        { status: 400 },
      );
    }

    const hints: ReparseRequestHints | undefined = updated?.locationJson
      ? {
          address: updated.locationJson.address?.trim() || undefined,
          district: updated.locationJson.district?.trim() || undefined,
          city: updated.locationJson.city?.trim() || undefined,
        }
      : undefined;

    const formSnapshot: ReparseFormSnapshot | undefined = updated
      ? {
          mediaName: updated.mediaName,
          description: updated.description,
          category: updated.category,
          price: updated.price,
          cpm: updated.cpm,
          targetAudience: updated.targetAudience,
          tags: updated.tags,
          pros: updated.pros,
        }
      : undefined;

    const result = await runReparseProposalForMediaId(mediaId.trim(), {
      hints,
      formSnapshot,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("[reparse-media]", e);
    return NextResponse.json(
      {
        ok: false,
        error: "서버 오류로 재파싱에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
