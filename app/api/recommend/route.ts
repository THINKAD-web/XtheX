import { NextResponse } from "next/server";
import { requireAdvertiserSession } from "@/lib/recommend/api-guard";
import { runMediaRecommendation } from "@/lib/recommend/run-recommendation";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const auth = await requireAdvertiserSession();
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.message },
      { status: auth.status },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "multipart/form-data가 필요합니다." },
      { status: 400 },
    );
  }

  const brief = String(form.get("brief") ?? "");
  const creative = form.get("creative");

  const creativeFile =
    creative instanceof File && creative.size > 0 ? creative : null;

  const result = await runMediaRecommendation({
    briefText: brief,
    creativeFile,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    brief: {
      budgetKrw: result.brief.budget_krw,
      durationWeeks: result.brief.duration_weeks,
      locationKeywords: result.brief.location_keywords,
      audienceTags: result.brief.audience_tags,
      styleNotes: result.brief.style_notes,
    },
    recommendations: result.recommendations,
    usedMockMedias: result.usedMockMedias,
    usedMockLlm: result.usedMockLlm,
  });
}
