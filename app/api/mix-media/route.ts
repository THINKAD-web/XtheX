import { NextResponse } from "next/server";
import {
  analyzeCreativeImageStyle,
  parseNaturalLanguageMix,
} from "@/lib/mix-media/parse-natural-language";
import { parseRecalculateBody } from "@/lib/mix-media/recalculate-schema";
import {
  buildMixProposals,
  fetchCandidateMedias,
} from "@/lib/mix-media/build-proposals";
import type { MixMediaResponse } from "@/lib/mix-media/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    let query = "";
    let imageBase64: string | undefined;
    let mime = "image/jpeg";

    if (ct.includes("application/json")) {
      const body = (await req.json()) as Record<string, unknown>;
      if (body.recalculate === true) {
        const rec = parseRecalculateBody(body);
        if (!rec.ok) {
          return NextResponse.json(
            { ok: false, error: rec.error },
            { status: 400 },
          );
        }
        const candidates = await fetchCandidateMedias(rec.parse);
        const proposals = buildMixProposals(candidates, rec.parse);
        const out: MixMediaResponse = {
          ok: true,
          parse: rec.parse,
          proposals,
          creative_analysis_ko: null,
        };
        return NextResponse.json(out);
      }
      query = String(body.query ?? "").trim();
    } else if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      query = String(form.get("query") ?? "").trim();
      const file = form.get("image");
      if (file instanceof File && file.size > 0) {
        if (file.size > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            { ok: false, error: "이미지는 4MB 이하로 올려주세요." },
            { status: 400 },
          );
        }
        const buf = Buffer.from(await file.arrayBuffer());
        imageBase64 = buf.toString("base64");
        if (file.type) mime = file.type;
      }
    } else {
      return NextResponse.json(
        { ok: false, error: "Content-Type은 JSON 또는 multipart여야 합니다." },
        { status: 415 },
      );
    }

    if (!query || query.length < 8) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "캠페인 브리프를 8자 이상 입력해 주세요. (예산·지역·기간·타겟)",
        },
        { status: 400 },
      );
    }

    let creative_analysis_ko: string | null = null;
    if (imageBase64) {
      creative_analysis_ko =
        (await analyzeCreativeImageStyle(imageBase64, mime)) || null;
    }

    const parse = await parseNaturalLanguageMix(
      query,
      creative_analysis_ko ?? "",
    );
    const candidates = await fetchCandidateMedias(parse);
    const proposals = buildMixProposals(candidates, parse);

    const out: MixMediaResponse = {
      ok: true,
      parse,
      proposals,
      creative_analysis_ko,
    };
    return NextResponse.json(out);
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "미디어 믹스 생성에 실패했습니다.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
