import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { findUserByClerkId } from "@/lib/auth/find-user-by-clerk";
import { processUserMediaSampleFiles } from "@/lib/admin/process-user-media-samples";

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

    const formData = await req.formData();
    const raw = formData.getAll("mediaSamples");
    const files = raw.filter((x): x is File => x instanceof File);

    if (files.length === 0) {
      return NextResponse.json({
        ok: true,
        urls: [],
        descriptions: [],
        descriptionExtras: "",
        warnings: [],
      });
    }

    const result = await processUserMediaSampleFiles(files);
    return NextResponse.json({
      ok: true,
      urls: result.urls,
      descriptions: result.descriptions,
      descriptionExtras: result.descriptionExtras,
      warnings: result.warnings,
    });
  } catch (e) {
    console.error("[media-samples]", e);
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error ? e.message : "매체 사진 처리 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
