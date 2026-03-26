import { z } from "zod";
import {
  chatCompletions,
  resolveChatLlm,
} from "@/lib/ai/openai-compatible-llm";

const aiOutputSchema = z.object({
  score: z.number().min(0).max(100),
  suitability: z.string().min(1),
  location_fit: z.string().min(1),
  pricing_fit: z.string().min(1),
  summary_ko: z.string().min(1),
});

export type MediaListingReviewResult = z.infer<typeof aiOutputSchema> & {
  comment: string;
};

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

export async function reviewMediaListing(input: {
  mediaName: string;
  categoryLabel: string;
  description: string;
  address: string;
  lat: number | null;
  lng: number | null;
  dailyImpressions: number;
  weeklyPriceKrw: number;
  cpm: number | null;
  availabilityNote: string;
}): Promise<MediaListingReviewResult> {
  const cfg = resolveChatLlm();
  if (!cfg) {
    return {
      score: 72,
      suitability: "LLM 키가 없어 자동 심사를 건너뜁니다.",
      location_fit: "관리자 검토를 기다려 주세요.",
      pricing_fit: "관리자 검토를 기다려 주세요.",
      summary_ko:
        "등록이 접수되었습니다. API 키 설정 후 재심사가 가능합니다.",
      comment:
        "[자동] LLM 미구성: XAI_API_KEY / OPENAI_API_KEY / GROQ_API_KEY 중 하나를 설정하면 AI 심사가 실행됩니다.",
    };
  }

  const prompt = [
    "다음 옥외광고 매체 등록 건을 심사하세요. 한국 시장 기준으로 적합성, 위치 타당성, 가격 적정성을 평가합니다.",
    "출력은 반드시 JSON 한 개만 (다른 텍스트 없이):",
    '{"score": 0-100 정수, "suitability": "적합성 한줄", "location_fit": "위치 한줄", "pricing_fit": "가격 한줄", "summary_ko": "종합 의견 2~3문장"}',
    "",
    `매체명: ${input.mediaName}`,
    `유형: ${input.categoryLabel}`,
    `설명: ${input.description}`,
    `주소: ${input.address}`,
    `위도/경도: ${input.lat ?? "미입력"}, ${input.lng ?? "미입력"}`,
    `일일 예상 노출: ${input.dailyImpressions}`,
    `주간 가격(원): ${input.weeklyPriceKrw}`,
    `CPM(원): ${input.cpm ?? "산출 또는 미입력"}`,
    `등록 기간: ${input.availabilityNote}`,
  ].join("\n");

  const raw = await chatCompletions(cfg, {
    temperature: 0.25,
    max_tokens: 800,
    messages: [
      {
        role: "system",
        content:
          "You are an OOH media quality reviewer. Reply with ONLY valid JSON, no markdown.",
      },
      { role: "user", content: prompt },
    ],
  });

  const parsed = aiOutputSchema.safeParse(extractJsonObject(raw) ?? {});
  if (!parsed.success) {
    return {
      score: 65,
      suitability: "응답 파싱에 실패했습니다. 관리자가 수동 검토합니다.",
      location_fit: "—",
      pricing_fit: "—",
      summary_ko: raw.slice(0, 400),
      comment: `AI 응답 파싱 실패. 원문 일부: ${raw.slice(0, 280)}`,
    };
  }

  const v = parsed.data;
  const comment = [
    `[종합 ${v.score}점] ${v.summary_ko}`,
    `적합성: ${v.suitability}`,
    `위치: ${v.location_fit}`,
    `가격: ${v.pricing_fit}`,
  ].join("\n");

  return { ...v, comment };
}
