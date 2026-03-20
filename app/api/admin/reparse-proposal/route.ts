import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { findUserByClerkId } from "@/lib/auth/find-user-by-clerk";
import {
  runReparseProposalForMediaId,
  type ReparseFormSnapshot,
  type ReparseRequestHints,
} from "@/lib/admin/run-reparse-proposal";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const dbUser = await findUserByClerkId(userId);
    if (!dbUser) {
      return NextResponse.json(
        { ok: false, error: "사용자 정보를 찾을 수 없습니다." },
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
