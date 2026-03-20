import { z } from "zod";
import type { MediaCategory } from "@prisma/client";
import {
  extractTextFromPdfBuffer,
  isPdfBuffer,
} from "@/lib/ai/pdf-text";
import {
  chatCompletions,
  hasChatLlm,
  resolveChatLlm,
} from "@/lib/ai/openai-compatible-llm";
import type { PdfVisionPageImage } from "@/lib/ai/pdf-page-images";

// --- Location (PDF 추출용) → Prisma Media.locationJson
export const extractedLocationSchema = z.object({
  address: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  map_link: z.string().nullable().optional(),
});

// --- Exposure (PDF 추출용) → Prisma Media.exposureJson
export const extractedExposureSchema = z.object({
  daily_traffic: z.union([z.number(), z.string()]).nullable().optional(),
  monthly_impressions: z.union([z.number(), z.string()]).nullable().optional(),
  reach: z.union([z.number(), z.string()]).nullable().optional(),
  frequency: z.union([z.number(), z.string()]).nullable().optional(),
});

// --- Category 문자열 → Prisma MediaCategory enum 매핑
const categoryKeys = [
  "BILLBOARD",
  "DIGITAL_BOARD",
  "TRANSIT",
  "STREET_FURNITURE",
  "WALL",
  "ETC",
] as const;
export const extractedCategorySchema = z.enum(categoryKeys);

// --- 전체 추출 결과 (Vision LLM 출력) → Prisma Media와 1:1 매핑 가능
export const extractedMediaDataSchema = z.object({
  media_name: z.string(),
  category: extractedCategorySchema,
  description: z.string().nullable().optional(),
  location: extractedLocationSchema.nullable().optional(),
  price: z.number().int().nonnegative().nullable().optional(),
  cpm: z.number().int().nonnegative().nullable().optional(),
  exposure: extractedExposureSchema.nullable().optional(),
  target_audience: z.string().nullable().optional(),
  images: z.array(z.string()).default([]),
  /** Vision+Supabase 제안서 샘플 + 사용자 업로드 URL */
  sampleImages: z.array(z.string()).default([]),
  /** 사용자 업로드 사진 설명 (Vision) */
  sampleDescriptions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  /** 타겟 인구 정규화 태그 (검색용, DB audienceTags) */
  audience_tags: z.array(z.string()).default([]),
  pros: z.string().nullable().optional(),
  cons: z.string().nullable().optional(),
  trust_score: z.number().int().min(0).max(100).nullable().optional(),
  additional: z.string().nullable().optional(),
});

export const ExtractedMediaDataZod = extractedMediaDataSchema;

export type ExtractedLocation = z.infer<typeof extractedLocationSchema>;
export type ExtractedExposure = z.infer<typeof extractedExposureSchema>;
export type ExtractedMediaData = z.infer<typeof extractedMediaDataSchema>;

export function toMediaCreateInput(
  data: ExtractedMediaData,
  overrides: {
    proposalFileUrl?: string | null;
    adminMemo?: string | null;
    createdById?: string | null;
  } = {},
) {
  const memo = [data.additional, overrides.adminMemo].filter(Boolean).join("\n") || null;
  return {
    mediaName: data.media_name,
    category: data.category as MediaCategory,
    description: data.description ?? null,
    locationJson: (data.location ?? {}) as object,
    price: data.price ?? null,
    cpm: data.cpm ?? null,
    exposureJson: (data.exposure ?? undefined) as object | undefined,
    targetAudience: data.target_audience ?? null,
    images: data.images ?? [],
    sampleImages: data.sampleImages ?? [],
    sampleDescriptions: data.sampleDescriptions ?? [],
    tags: data.tags ?? [],
    audienceTags: data.audience_tags ?? [],
    pros: data.pros ?? null,
    cons: data.cons ?? null,
    trustScore: data.trust_score ?? null,
    proposalFileUrl: overrides.proposalFileUrl ?? null,
    adminMemo: memo || null,
    createdById: overrides.createdById ?? null,
  };
}

function extractJsonObject(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `You extract structured data from Korean outdoor advertising (OOH) media proposal PDF text.
Output ONLY a single valid JSON object (no markdown, no code fence) with exactly these keys:
{
  "media_name": string (required, concise Korean name of the media/site),
  "category": one of BILLBOARD | DIGITAL_BOARD | TRANSIT | STREET_FURNITURE | WALL | ETC,
  "description": string or null,
  "location": { "address", "district", "lat", "lng", "map_link" } or null
    — lat/lng: ONLY if the document text explicitly states numbers (e.g. 37.4979, 127.0276, or "위도 37.5"). Otherwise null. Do not guess coordinates.
    — address/district: from text when present; do not invent street names.
    — map_link: only if an http(s) URL appears in the text; else null,
  "price": integer KRW total or monthly if clear, else null,
  "cpm": integer KRW if stated, else null,
  "exposure": { "daily_traffic", "monthly_impressions", "reach", "frequency" } as strings or numbers, null fields ok,
  "target_audience": string or null,
  "images": string[] — ONLY complete http(s) URLs literally present in the extracted PDF text. If the PDF only has embedded photos (no URL in text), use empty array []. Never use placeholder phrases like "현장 사진".
  "tags": string[] (Korean keywords, 3–8 items),
  "pros": string or null,
  "cons": string or null,
  "trust_score": integer 0-100 estimate from document quality/clarity,
  "additional": string or null (other admin-relevant notes)
}
Use Korean where natural.`;

async function callLlmExtract(
  documentText: string,
  adminMemo?: string,
): Promise<ExtractedMediaData> {
  const cfg = resolveChatLlm();
  if (!cfg) {
    throw new Error("Missing XAI_API_KEY (또는 하위호환 OPENAI_API_KEY)");
  }
  const maxChars = 100_000;
  const body =
    (adminMemo?.trim()
      ? `관리자 메모: ${adminMemo.trim()}\n\n---\n\n`
      : "") + `제안서 본문:\n${documentText.slice(0, maxChars)}`;

  const text = await chatCompletions(cfg, {
    temperature: 0.15,
    max_tokens: 4096,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: body },
    ],
  });

  let raw = extractJsonObject(text);
  let parsed = extractedMediaDataSchema.safeParse(raw);

  if (!parsed.success && raw) {
    try {
      const fixText = await chatCompletions(cfg, {
        temperature: 0,
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content:
              "Fix the following into ONE valid JSON object matching the media proposal schema. Output ONLY raw JSON.",
          },
          { role: "user", content: String(text).slice(0, 12000) },
        ],
      });
      raw = extractJsonObject(fixText);
      parsed = extractedMediaDataSchema.safeParse(raw);
    } catch {
      /* keep first parse failure */
    }
  }

  if (!parsed.success) {
    throw new Error(
      "AI가 제안서에서 구조화된 데이터를 만들지 못했습니다. PDF 텍스트가 이미지 위주면 OCR/PDF 텍스트 추출이 필요할 수 있습니다.",
    );
  }
  return parsed.data;
}

function mockExtractedData(adminMemo?: string): ExtractedMediaData {
  return {
    media_name: "강남역 4번 출구 대형 LED 전광판 (MOCK)",
    category: "DIGITAL_BOARD",
    description:
      adminMemo?.trim() ||
      "MOCK: 서울 강남역 4번 출구 앞 대형 LED 전광판. 20~30대 직장인 타겟.",
    location: {
      address: "서울특별시 강남구 강남대로 408, 강남역 4번 출구 앞",
      district: "강남구",
      city: "서울특별시",
      lat: 37.49794,
      lng: 127.02762,
      map_link: "추정: https://maps.google.com/?q=37.49794,127.02762",
    },
    price: 25000000,
    cpm: 9500,
    exposure: {
      daily_traffic: "추정: 250000명/일",
      monthly_impressions: "약 7500000회",
      reach: "추정: 1800000명/월",
      frequency: "약 4.2회/인",
    },
    target_audience: "20~30대 직장인, 대학생, 프리랜서",
    images: ["MOCK: 전경 이미지", "MOCK: 야간 노출 이미지"],
    sampleImages: [],
    sampleDescriptions: [],
    tags: ["MOCK", "강남역", "디지털보드"],
    audience_tags: ["오피스워커", "20대", "통근객"],
    pros: "MOCK: 서울 핵심 상권, 야간 시인성 우수.",
    cons: "MOCK: 집행 단가 높음.",
    trust_score: 82,
    additional: "MOCK: 지하철 2호선·신분당선 환승으로 유입량 높음.",
  };
}

export type ExtractReparseOptions = {
  extraUserBlock?: string;
  reparse?: boolean;
};

/** 단일 매체 업데이트(재파싱 등) — 다중 추출 시 첫 항목만 사용 */
export async function extractMediaFromProposal(
  file: Buffer,
  adminMemo?: string,
  fileName?: string,
  reparseOptions?: ExtractReparseOptions,
): Promise<ExtractedMediaData> {
  const all = await extractAllMediaFromProposalPdf(
    file,
    adminMemo,
    fileName,
    reparseOptions,
  );
  if (all.length > 1) {
    console.warn(
      "[extract] extractMediaFromProposal: PDF에서",
      all.length,
      "건 추출됨 → 재파싱은 첫 항목만 반영. 다건은 AI 업로드로 초안 분리 생성.",
    );
  }
  const first = all[0];
  if (!first) {
    throw new Error("EXTRACT:추출 결과가 비어 있습니다.");
  }
  return first;
}

/**
 * PDF 한 건에서 추출된 매체 초안 목록 (다중 매체 제안서 → 여러 항목).
 */
export async function extractAllMediaFromProposalPdf(
  file: Buffer,
  adminMemo?: string,
  fileName?: string,
  reparseOptions?: ExtractReparseOptions,
): Promise<ExtractedMediaData[]> {
  if (!file || file.length === 0) {
    throw new Error("extractAllMediaFromProposalPdf: file buffer is empty");
  }

  const ext = fileName?.toLowerCase().match(/\.(pdf|ppt|pptx)$/)?.[1] ?? "";
  const hasLlm = hasChatLlm();
  const forceMock = process.env.AI_EXTRACT_MOCK === "1";

  if (forceMock || !hasLlm) {
    if (!hasLlm) {
      console.warn(
        "[extract] API 키 없음 → 목업. .env.local에 GROK_API_KEY(xai-… 또는 gsk_…), XAI_API_KEY, GROQ_API_KEY, 또는 OPENAI_API_KEY 중 하나를 넣으세요.",
      );
    } else {
      console.warn("[extract] AI_EXTRACT_MOCK=1 → 목업 사용");
    }
    return [mockExtractedData(adminMemo)];
  }

  if (ext === "ppt" || ext === "pptx") {
    throw new Error(
      "EXTRACT:PPT/PPTX 실제 AI 추출은 아직 PDF만 지원합니다. PowerPoint에서 「다른 이름으로 저장 → PDF」로보낸 뒤 업로드해 주세요.",
    );
  }

  if (!isPdfBuffer(file)) {
    throw new Error(
      "EXTRACT:PDF 파일만 실제 추출을 지원합니다. PDF로 저장 후 다시 업로드해 주세요.",
    );
  }

  let text: string;
  try {
    text = await extractTextFromPdfBuffer(file);
  } catch (e) {
    console.error("[extract] PDF 텍스트 추출 실패:", e);
    throw new Error(
      "EXTRACT:PDF를 읽지 못했습니다. 파일이 손상되었거나 암호로 보호되어 있을 수 있습니다.",
    );
  }

  if (text.length < 80) {
    throw new Error(
      "EXTRACT:PDF에서 추출한 텍스트가 거의 없습니다. 스캔 이미지로만 된 PDF는 텍스트 추출이 어렵습니다. 텍스트 PDF로 다시 시도하거나, 목업 테스트 시 XAI_API_KEY를 비우세요.",
    );
  }

  const cfg = resolveChatLlm();
  if (!cfg) {
    return [mockExtractedData(adminMemo)];
  }
  return extractAllMediaFromProposalPdfInner(
    text,
    adminMemo,
    cfg,
    file,
    reparseOptions,
  );
}

async function extractAllMediaFromProposalPdfInner(
  documentText: string,
  adminMemo: string | undefined,
  cfg: NonNullable<ReturnType<typeof resolveChatLlm>>,
  pdfBuffer?: Buffer,
  reparseOptions?: ExtractReparseOptions,
): Promise<ExtractedMediaData[]> {
  const label =
    cfg.provider === "xai"
      ? "Grok(xAI)"
      : cfg.provider === "groq"
        ? "Groq"
        : "LLM";
  try {
    const { extractStructuredProposalWithGrok } = await import(
      "@/lib/ai/grok-proposal-structured"
    );
    let visionPages: PdfVisionPageImage[] | undefined;
    if (cfg.provider === "xai" && pdfBuffer && isPdfBuffer(pdfBuffer)) {
      try {
        const { renderPdfPagesForVision } = await import(
          "@/lib/ai/pdf-page-images"
        );
        visionPages = await renderPdfPagesForVision(pdfBuffer);
      } catch (e) {
        console.warn(
          "[extract] PDF→이미지 렌더 생략:",
          e instanceof Error ? e.message : e,
        );
      }
    }
    const list = await extractStructuredProposalWithGrok(
      cfg,
      documentText,
      adminMemo,
      visionPages,
      reparseOptions?.extraUserBlock || reparseOptions?.reparse
        ? {
            extraUserBlock: reparseOptions.extraUserBlock,
            reparse: reparseOptions.reparse,
          }
        : undefined,
    );
    if (list.length > 0) {
      console.log(
        `[extract] ${label} 구조화 추출 성공 — media_items:`,
        list.length,
      );
      return list;
    }
  } catch (e) {
    console.error(
      `[extract] ${label} 구조화 추출 실패 → 단일 스키마 폴백:`,
      e instanceof Error ? e.message : e,
    );
  }

  const single = await callLlmExtract(documentText, adminMemo);
  return [single];
}
