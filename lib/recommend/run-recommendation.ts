import { prisma } from "@/lib/prisma";
import {
  analyzeCreativeImageStyle,
  parseNaturalLanguageMix,
} from "@/lib/mix-media/parse-natural-language";
import { hasChatLlm } from "@/lib/ai/openai-compatible-llm";
import type { NaturalLanguageMixParse } from "@/lib/mix-media/types";
import { getMockRecommendations } from "./mock-recommendations";
import { scoreAndRankMedias } from "./score-medias";
import type { MediaRecommendationItem } from "./types";

const MAX_FILE_BYTES = 4.5 * 1024 * 1024;

export type RunRecommendationResult = {
  ok: true;
  brief: NaturalLanguageMixParse;
  recommendations: MediaRecommendationItem[];
  usedMockMedias: boolean;
  usedMockLlm: boolean;
};

export type RunRecommendationError = {
  ok: false;
  error: string;
};

export async function runMediaRecommendation(params: {
  briefText: string;
  creativeFile?: File | null;
}): Promise<RunRecommendationResult | RunRecommendationError> {
  const briefText = params.briefText?.trim() ?? "";
  if (briefText.length < 8) {
    return { ok: false, error: "캠페인 설명을 조금 더 적어 주세요 (8자 이상)." };
  }

  let creativeHint = "";
  const file = params.creativeFile;
  if (file && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return {
        ok: false,
        error: "이미지는 4.5MB 이하로 올려 주세요.",
      };
    }
    const mime = file.type || "image/jpeg";
    if (!mime.startsWith("image/")) {
      return { ok: false, error: "이미지 파일만 업로드할 수 있습니다." };
    }
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      creativeHint = await analyzeCreativeImageStyle(
        buf.toString("base64"),
        mime,
      );
    } catch {
      creativeHint = "";
    }
  }

  const usedMockLlm = !hasChatLlm();

  let brief: NaturalLanguageMixParse;
  try {
    brief = await parseNaturalLanguageMix(briefText, creativeHint);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI 분석에 실패했습니다.";
    return { ok: false, error: msg };
  }

  const medias = await prisma.media.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      mediaName: true,
      category: true,
      description: true,
      locationJson: true,
      exposureJson: true,
      price: true,
      cpm: true,
      tags: true,
      audienceTags: true,
    },
    take: 400,
    orderBy: { updatedAt: "desc" },
  });

  let recommendations: MediaRecommendationItem[];
  let usedMockMedias = false;

  if (medias.length === 0) {
    recommendations = getMockRecommendations();
    usedMockMedias = true;
  } else {
    recommendations = scoreAndRankMedias(medias, brief, 5);
    if (recommendations.length === 0) {
      recommendations = getMockRecommendations();
      usedMockMedias = true;
    }
  }

  return {
    ok: true,
    brief,
    recommendations,
    usedMockMedias,
    usedMockLlm,
  };
}
