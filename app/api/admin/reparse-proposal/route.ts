import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { findUserById } from "@/lib/auth/find-user-by-clerk";
import { getAuthSession } from "@/lib/auth/session";

type ReparseRequestHints = {
  address?: string;
  district?: string;
  city?: string;
};

type ReparseFormSnapshot = {
  mediaName?: string;
  description?: string | null;
  category?: string;
  price?: number | null;
  cpm?: number | null;
  targetAudience?: string | null;
  tags?: string[];
  pros?: string | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      mediaId?: string;
      hints?: ReparseRequestHints;
      formSnapshot?: ReparseFormSnapshot;
    };
    const mediaId = typeof body.mediaId === "string" ? body.mediaId.trim() : "";
    if (!mediaId) {
      return NextResponse.json(
        { ok: false, error: "mediaId가 필요합니다." },
        { status: 400 },
      );
    }

    const { runReparseProposalForMediaId } = await import(
      "@/lib/admin/run-reparse-proposal"
    );
    const result = await runReparseProposalForMediaId(mediaId, {
      hints: body.hints,
      formSnapshot: body.formSnapshot,
    });
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("reparse-proposal route:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "서버 오류로 재파싱에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
