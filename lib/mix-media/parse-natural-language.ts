/**
 * 자연어 + 선택 크리에이티브 이미지 → 구조화 쿼리 (Grok / Groq / OpenAI).
 */
import { z } from "zod";
import {
  chatCompletions,
  resolveChatLlm,
  type ChatContentPart,
} from "@/lib/ai/openai-compatible-llm";
import { ALL_CANONICAL_AUDIENCE_TAGS } from "@/lib/media/audience-tags";
import type { MediaCategory } from "@prisma/client";
import type { NaturalLanguageMixParse } from "./types";

const CATEGORIES: MediaCategory[] = [
  "BILLBOARD",
  "DIGITAL_BOARD",
  "TRANSIT",
  "STREET_FURNITURE",
  "WALL",
  "ETC",
];

const parseSchema = z.object({
  target: z.object({
    age_band: z.string().nullable(),
    gender: z.string().nullable(),
    lifestyle_notes: z.string().nullable(),
  }),
  audience_tags: z.array(z.string()).default([]),
  budget_krw: z.number().int().nonnegative(),
  duration_weeks: z.number().int().min(1).max(104),
  location_keywords: z.array(z.string()).default([]),
  goal: z.string(),
  style_notes: z.string().default(""),
  preferred_categories: z.array(z.string()).default([]),
});

const SYSTEM = `You parse Korean/English outdoor advertising campaign briefs into strict JSON.
Output ONLY JSON (no markdown).

audience_tags: use ONLY from this list when applicable (subset): ${ALL_CANONICAL_AUDIENCE_TAGS.join(", ")}
Add extra short Korean tags only if clearly needed (e.g. "MZ", "F&B").

budget_krw: total campaign budget in KRW integer. If user says "5000만" → 50000000.
duration_weeks: e.g. "4주" → 4, "3개월" → 12.
location_keywords: e.g. ["서울","강남"].
goal: one of awareness | traffic | sales | brand (infer).
preferred_categories: rank 2-4 from BILLBOARD, DIGITAL_BOARD, TRANSIT, STREET_FURNITURE, WALL, ETC based on brief (young trendy cafe → DIGITAL_BOARD, TRANSIT first).

Example input: "20대 여성, 예산 5천만, 강남 4주, 카페 브랜드 트렌디"
Example JSON:
{"target":{"age_band":"20대","gender":"female","lifestyle_notes":"카페"},"audience_tags":["20대","여성층","쇼핑러"],"budget_krw":50000000,"duration_weeks":4,"location_keywords":["서울","강남"],"goal":"brand","style_notes":"트렌디 카페","preferred_categories":["DIGITAL_BOARD","TRANSIT","STREET_FURNITURE"]}`;

function extractJson(text: string): unknown {
  const t = text.trim();
  try {
    return JSON.parse(t);
  } catch {
    const s = t.indexOf("{");
    const e = t.lastIndexOf("}");
    if (s === -1 || e <= s) return null;
    try {
      return JSON.parse(t.slice(s, e + 1));
    } catch {
      return null;
    }
  }
}

export async function analyzeCreativeImageStyle(
  imageBase64: string,
  mime: string,
): Promise<string> {
  const cfg = resolveChatLlm();
  if (!cfg) return "";
  const visionModel =
    process.env.XAI_VISION_MODEL?.trim() ||
    (cfg.provider === "xai" ? "grok-4" : cfg.model);
  const parts: ChatContentPart[] = [
    {
      type: "text",
      text: "이 광고 크리에이티브/무드보드 이미지를 보고, 한국어로 옥외광고 매체 스타일 힌트만 2~3문장 (예: 트렌디·MZ → 디지털/AR/지하철 PSD, 프리미엄 → 빌보드·래핑). JSON 아님, 평문만.",
    },
    {
      type: "image_url",
      image_url: { url: `data:${mime};base64,${imageBase64}` },
    },
  ];
  try {
    const text = await chatCompletions(cfg, {
      temperature: 0.2,
      max_tokens: 400,
      modelOverride: cfg.provider === "xai" ? visionModel : undefined,
      messages: [
        {
          role: "system",
          content:
            "You are an OOH media planner. Reply in Korean only, concise.",
        },
        { role: "user", content: parts },
      ],
    });
    return text.trim().slice(0, 800);
  } catch {
    return "";
  }
}

export async function parseNaturalLanguageMix(
  userText: string,
  creativeStyleHint: string,
): Promise<NaturalLanguageMixParse> {
  const cfg = resolveChatLlm();
  if (!cfg) {
    return {
      target: {
        age_band: "20대",
        gender: null,
        lifestyle_notes: "카페·F&B",
      },
      audience_tags: ["20대", "여성층", "쇼핑러"],
      budget_krw: 50_000_000,
      duration_weeks: 4,
      location_keywords: ["서울", "강남"],
      goal: "brand",
      style_notes: userText.slice(0, 200) || "MOCK",
      preferred_categories: ["DIGITAL_BOARD", "TRANSIT"],
    };
  }

  const user =
    (creativeStyleHint
      ? `[크리에이티브 이미지 분석 힌트]\n${creativeStyleHint}\n\n`
      : "") + `브리프:\n${userText.slice(0, 4000)}`;

  let text: string;
  try {
    text = await chatCompletions(cfg, {
      temperature: 0.1,
      max_tokens: 1200,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      response_format:
        cfg.provider === "xai" || cfg.provider === "openai"
          ? { type: "json_object" }
          : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      cfg.provider === "xai" &&
      (msg.includes("400") || msg.includes("response_format"))
    ) {
      text = await chatCompletions(cfg, {
        temperature: 0.1,
        max_tokens: 1200,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
      });
    } else throw e;
  }

  const raw = extractJson(text);
  const parsed = parseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      "브리프를 구조화하지 못했습니다. 예산·지역·기간을 문장에 포함해 주세요.",
    );
  }
  const d = parsed.data;
  return {
    target: {
      age_band: d.target.age_band,
      gender: d.target.gender,
      lifestyle_notes: d.target.lifestyle_notes,
    },
    audience_tags: d.audience_tags,
    budget_krw: Math.min(Math.max(d.budget_krw, 1_000_000), 500_000_000_000),
    duration_weeks: d.duration_weeks,
    location_keywords: d.location_keywords,
    goal: d.goal,
    style_notes: d.style_notes,
    preferred_categories: (() => {
      const v = d.preferred_categories.filter((c) =>
        CATEGORIES.includes(c as MediaCategory),
      ) as MediaCategory[];
      return v.length ? v : (["DIGITAL_BOARD", "TRANSIT"] as MediaCategory[]);
    })(),
  };
}
