/**
 * Grok/xAI structured JSON extraction for Korean OOH proposal PDFs.
 * media_items[] → downstream ExtractedMediaData per item.
 */
import { z } from "zod";
import type { ExtractedMediaData } from "@/lib/ai/extract-media-from-proposal";
import type { MediaCategory } from "@prisma/client";
import {
  chatCompletions,
  type ChatContentPart,
  type ChatMessageInput,
  type ResolvedChatLlm,
} from "@/lib/ai/openai-compatible-llm";
import type { PdfVisionPageImage } from "@/lib/ai/pdf-page-images";
import { deriveAudienceTagsFromDemographics } from "@/lib/media/audience-tags";

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v))
    return Math.max(0, Math.round(v));
  const s = String(v).replace(/[,，\s]/g, "").replace(/원|KRW|만/g, "");
  const m = s.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
}

/** 단일 한국어 숫자 표기 → 정수 (만/천/원 제거 전 처리) */
function parseSingleKoreanNumber(raw: string): number | null {
  const t = String(raw)
    .trim()
    .replace(/[,，\s]/g, "")
    .replace(/원|KRW|원대/gi, "");
  if (!t) return null;
  const man = t.match(/^(\d+(?:\.\d+)?)\s*만$/);
  if (man) return Math.max(0, Math.round(parseFloat(man[1]) * 10000));
  const cheon = t.match(/^(\d+(?:\.\d+)?)\s*천$/);
  if (cheon) return Math.max(0, Math.round(parseFloat(cheon[1]) * 1000));
  const m = t.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
}

/**
 * daily_impressions / cpm이 범위 문자열이면 중앙값 + 범위 표기용 문구.
 */
function parseNumericWithRangeNote(
  raw: string | number | null | undefined,
): { value: number | null; rangeNote: string | null } {
  if (raw == null || raw === "") return { value: null, rangeNote: null };
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { value: Math.max(0, Math.round(raw)), rangeNote: null };
  }
  const s = String(raw).trim();
  const sep = /\s*[~～〜\-–]\s*/;
  const parts = s.split(sep).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const a =
      parseSingleKoreanNumber(parts[0]) ?? numOrNull(parts[0].replace(/만/g, ""));
    const b =
      parseSingleKoreanNumber(parts[1]) ?? numOrNull(parts[1].replace(/만/g, ""));
    if (a != null && b != null) {
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      const mid = Math.round((lo + hi) / 2);
      const displayRange = `${parts[0]}~${parts[1]}`;
      return {
        value: mid,
        rangeNote: `범위: ${displayRange}`,
      };
    }
  }
  const single = parseSingleKoreanNumber(s);
  if (single != null) return { value: single, rangeNote: null };
  return { value: numOrNull(s), rangeNote: null };
}

/** "즉시 ~ 3개월" 등 → 정규화 문구 */
function normalizeAvailablePeriod(
  s: string | null | undefined,
): string | null {
  if (s == null || !String(s).trim()) return s ?? null;
  let t = String(s).trim();
  t = t.replace(
    /즉시\s*[~～〜]\s*(\d+)\s*개월(?:\s*이내)?/gi,
    "즉시 시작, 최대 $1개월",
  );
  t = t.replace(
    /즉시\s*[-–]\s*(\d+)\s*개월(?:\s*이내)?/gi,
    "즉시 시작, 최대 $1개월",
  );
  t = t.replace(
    /즉시\s*[~～〜]\s*(\d+)\s*주/gi,
    "즉시 시작, 최대 $1주",
  );
  t = t.replace(/즉시\s*~\s*/gi, "즉시 시작 · ");
  return t;
}

const locationSchema = z.object({
  full_address: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  latitude: z.union([z.number(), z.string(), z.null()]).optional(),
  longitude: z.union([z.number(), z.string(), z.null()]).optional(),
});

const mediaItemSchema = z.object({
  media_name: z.string(),
  media_type: z.string(),
  location: locationSchema.optional().nullable(),
  dimensions: z.string().nullable().optional(),
  daily_impressions: z.union([z.number(), z.string(), z.null()]).optional(),
  cpm: z.union([z.number(), z.string(), z.null()]).optional(),
  price_per_week: z.union([z.number(), z.string(), z.null()]).optional(),
  price_per_month: z.union([z.number(), z.string(), z.null()]).optional(),
  available_period: z.string().nullable().optional(),
  target_demographics: z.string().nullable().optional(),
  special_features: z.array(z.string()).optional().default([]),
  contract_terms: z.string().nullable().optional(),
  sample_image_descriptions: z.array(z.string()).optional().default([]),
  additional_notes: z.string().nullable().optional(),
});

const rootSchema = z.object({
  media_items: z.array(mediaItemSchema).min(1),
  overall_summary: z.string().optional().default(""),
  media_owner: z.string().optional().default(""),
  contact_info: z.string().optional().default(""),
});

export type GrokProposalRoot = z.infer<typeof rootSchema>;

const MEDIA_TYPE_TO_CATEGORY: Record<string, MediaCategory> = {
  빌보드: "BILLBOARD",
  지하철: "TRANSIT",
  버스정류장: "STREET_FURNITURE",
  디지털사이니지: "DIGITAL_BOARD",
  엘리베이터: "ETC",
  택시: "ETC",
  기타: "ETC",
};

function mapMediaType(t: string): MediaCategory {
  const k = String(t || "").trim();
  const c = MEDIA_TYPE_TO_CATEGORY[k];
  if (c) return c;
  if (/billboard|빌보드/i.test(k)) return "BILLBOARD";
  if (/digital|led|사이니지|전광/i.test(k)) return "DIGITAL_BOARD";
  if (/subway|metro|지하철|역사/i.test(k)) return "TRANSIT";
  if (/bus|버스|쉘터/i.test(k)) return "STREET_FURNITURE";
  if (/wall|벽면|외벽/i.test(k)) return "WALL";
  return "ETC";
}

/** 본문에서 OOH 특장 키워드 → 표준 태그 */
const FEATURE_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /LED|엘이디/i, label: "LED" },
  { re: /\bAR\b|증강현실|AR광고/i, label: "AR" },
  { re: /3[Dd]|쓰리디|입체광고/i, label: "3D" },
  { re: /디지털|digital|사이니지|전광판/i, label: "디지털" },
  { re: /모션|motion|동영상\s*광고|영상\s*소재/i, label: "모션" },
  { re: /인터랙티브|터치스크린/i, label: "인터랙티브" },
  { re: /야간\s*조명|야간\s*가시|나이트\s*노출/i, label: "야간조명" },
  { re: /초대형|대형\s*보드|빌딩\s*랩핑/i, label: "대형포맷" },
  { re: /교차로|코너\s*빌보드|T\s*간판/i, label: "코너노출" },
  { re: /지하철|역사|플랫폼|PSD|DID/i, label: "도시철도" },
  { re: /버스\s*쉘터|정류장|BRT/i, label: "버스쉘터" },
  { re: /실내\s*미디어|로비|엘리베이터\s*LCD/i, label: "실내미디어" },
  { re: /프로그래매틱|RTB|프로그램\s*매틱/i, label: "프로그래매틱" },
  { re: /택시\s*탑|루프탑/i, label: "택시광고" },
  { re: /옥외|OOH|out\s*of\s*home/i, label: "OOH" },
  { re: /고정\s*식|고정형|논스크롤/i, label: "고정매체" },
  { re: /스크롤|롤링|교대\s*노출/i, label: "스크롤매체" },
  { re: /공항|터미널|게이트/i, label: "공항매체" },
  { re: /편의점|드럭스토어|무인\s*점포/i, label: "근거리소매" },
  { re: /전철|commuter\s*rail/i, label: "전철" },
];

function normalizeSpecialFeatures(
  item: z.infer<typeof mediaItemSchema>,
): string[] {
  const set = new Set<string>();
  for (const s of item.special_features ?? []) {
    const v = String(s).trim();
    if (v) set.add(v);
  }
  const haystack = [
    item.media_name,
    item.dimensions,
    item.contract_terms,
    item.additional_notes,
    item.target_demographics,
    item.available_period,
  ]
    .filter(Boolean)
    .join(" ");
  for (const { re, label } of FEATURE_PATTERNS) {
    if (re.test(haystack)) set.add(label);
  }
  return Array.from(set);
}

/** full_address 없을 때 district + city 등으로 주소 보강 */
function resolveFullAddress(loc: {
  full_address?: string | null;
  district?: string | null;
  city?: string | null;
}): string {
  const fa = String(loc.full_address ?? "").trim();
  if (fa) return fa;
  const city = String(loc.city ?? "").trim();
  const dist = String(loc.district ?? "").trim();
  if (city && dist) {
    if (dist.includes("구") || dist.includes("시") || dist.includes("군")) {
      return `${city} ${dist}`.trim();
    }
    return `${city} ${dist}`.trim();
  }
  return city || dist || "";
}

/** Vision/캡션 텍스트에서 한국 행정구역·도로명 스니펫 추출 (폴백) */
function sniffAddressFromBlob(blob: string): string | null {
  if (!blob || blob.length < 6) return null;
  const t = blob.replace(/\s+/g, " ").trim();
  const patterns = [
    /서울(?:특별시)?\s*[\w가-힣]+구\s+[\w가-힣0-9·\s,.\-]+(?:로|길|대로)\s*\d*[\w가-힣0-9\-]*/,
    /(부산|대구|인천|광주|대전|울산)광역시\s*[\w가-힣]+(?:구|군)\s+[\w가-힣0-9·\s]+(?:로|길|대로)/,
    /[\w가-힣]+(?:구|시|군)\s+[\w가-힣0-9]+(?:로|길|대로)\s*\d+/,
    /위치[:\s]+([^\n]{8,80})/,
    /설치\s*위치[:\s]+([^\n]{8,80})/,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const s = (m[0] || m[1] || "").trim();
      if (s.length >= 8 && s.length < 200) return s;
    }
  }
  return null;
}

/**
 * 월 단가 우선. 주 단가만 있으면 월 환산(×4). 0은 미기재로 간주.
 * 월만 있을 때 주 추정(월/4.25)은 설명용 문자열로 반환.
 */
function resolvePrices(item: z.infer<typeof mediaItemSchema>): {
  priceMonth: number | null;
  priceWeek: number | null;
  priceKrwForDb: number | null;
  priceNote: string | null;
} {
  let pm = numOrNull(item.price_per_month);
  let pw = numOrNull(item.price_per_week);
  if (pw === 0) pw = null;
  if (pm === 0) pm = null;

  let priceKrwForDb: number | null = null;
  let priceNote: string | null = null;

  if (pm != null && pw != null) {
    priceKrwForDb = pm;
    priceNote = `월 ${pm.toLocaleString()}원 · 주 ${pw.toLocaleString()}원 (DB월단가 우선)`;
  } else if (pm != null) {
    priceKrwForDb = pm;
    const estWeek = Math.round(pm / 4.25);
    priceNote = `주 단가 추정(월÷4.25): 약 ${estWeek.toLocaleString()}원`;
  } else if (pw != null) {
    priceKrwForDb = pw * 4;
    priceNote = `월 환산(주×4): 약 ${priceKrwForDb.toLocaleString()}원`;
  }

  return { priceMonth: pm, priceWeek: pw, priceKrwForDb, priceNote };
}

function itemToExtracted(
  item: z.infer<typeof mediaItemSchema>,
  index: number,
  meta: {
    overall_summary: string;
    media_owner: string;
    contact_info: string;
  },
  adminMemo?: string,
  visionImageFailure?: boolean,
): ExtractedMediaData {
  const loc = item.location ?? {};
  let address = resolveFullAddress(loc);
  const visionBlob = [
    item.media_name,
    ...(item.sample_image_descriptions ?? []),
    item.additional_notes,
  ]
    .filter(Boolean)
    .join(" ");
  if (!address.trim()) {
    const sniffed = sniffAddressFromBlob(visionBlob);
    if (sniffed) address = sniffed;
  }
  const cityStr = String(loc.city ?? "").trim();
  const distStr = String(loc.district ?? "").trim();
  if (!address.trim() && (cityStr || distStr)) {
    address = [cityStr, distStr].filter(Boolean).join(" ").trim();
    if (address && !/로|길|대로|번지/.test(address)) {
      address = `${address} (상세주소 문서·이미지 미기재)`;
    }
  }

  const latRaw = loc.latitude;
  const lngRaw = loc.longitude;
  const lat =
    typeof latRaw === "number"
      ? latRaw
      : latRaw != null && latRaw !== ""
        ? parseFloat(String(latRaw))
        : null;
  const lng =
    typeof lngRaw === "number"
      ? lngRaw
      : lngRaw != null && lngRaw !== ""
        ? parseFloat(String(lngRaw))
        : null;
  const latOk =
    lat != null && !Number.isNaN(lat) && Math.abs(lat) <= 90 && !(lat === 0 && lng === 0);
  const lngOk =
    lng != null && !Number.isNaN(lng) && Math.abs(lng) <= 180;

  const impParsed = parseNumericWithRangeNote(item.daily_impressions);
  const cpmParsed = parseNumericWithRangeNote(item.cpm);
  const dailyImp = impParsed.value;
  const { priceKrwForDb: price, priceNote } = resolvePrices(item);
  const cpm = cpmParsed.value;

  const periodNorm = normalizeAvailablePeriod(item.available_period ?? undefined);
  const mergedAdditionalNotes = [
    item.additional_notes?.trim(),
    impParsed.rangeNote,
    cpmParsed.rangeNote,
  ]
    .filter(Boolean)
    .join(" · ");

  const descLines = [
    item.dimensions ? `규격: ${item.dimensions}` : "",
    dailyImp != null ? `일 노출(추정): ${dailyImp.toLocaleString()}` : "",
    periodNorm ? `집행 가능 기간: ${periodNorm}` : "",
    item.target_demographics ? `타겟: ${item.target_demographics}` : "",
    item.contract_terms ? `계약 조건: ${item.contract_terms}` : "",
    mergedAdditionalNotes ? `비고: ${mergedAdditionalNotes}` : "",
    priceNote ? `가격: ${priceNote}` : "",
  ].filter(Boolean);

  const failNote = "이미지 분석 실패: PDF 원본 확인하세요";
  let samples = [...(item.sample_image_descriptions ?? [])];
  if (
    visionImageFailure &&
    !samples.some(
      (s) =>
        String(s).includes("이미지 분석 실패") ||
        String(s).includes("이미지 추출 실패"),
    )
  ) {
    samples.push(failNote);
  }
  const imageUrls = samples.filter((s) => /^https?:\/\//i.test(String(s).trim()));
  const imageDesc = samples.filter((s) => !/^https?:\/\//i.test(String(s).trim()));

  const normalizedFeatures = normalizeSpecialFeatures(item);
  const tagSet = new Set<string>();
  for (const f of normalizedFeatures) {
    const t = String(f).trim();
    if (t) tagSet.add(t);
  }
  if (item.media_type) tagSet.add(item.media_type);
  let tags = Array.from(tagSet).slice(0, 14);
  if (tags.length === 0) {
    tags = ["OOH", String(mapMediaType(item.media_type))];
  }
  const audience_tags = deriveAudienceTagsFromDemographics(
    item.target_demographics,
  );

  const additionalParts = [
    index === 0 && meta.overall_summary
      ? `[제안서 요약] ${meta.overall_summary}`
      : "",
    index === 0 && meta.media_owner ? `[매체사] ${meta.media_owner}` : "",
    index === 0 && meta.contact_info ? `[연락] ${meta.contact_info}` : "",
    imageDesc.length ? `[이미지 설명] ${imageDesc.join(" | ")}` : "",
    adminMemo?.trim() ? `[관리자 메모] ${adminMemo.trim()}` : "",
  ].filter(Boolean);

  return {
    media_name: item.media_name?.trim() || `매체 ${index + 1}`,
    category: mapMediaType(item.media_type),
    description: descLines.length ? descLines.join("\n") : null,
    location: {
      address: address?.trim() || null,
      district: loc.district?.trim() || null,
      city: loc.city?.trim() || null,
      lat: latOk ? lat : null,
      lng: lngOk ? lng : null,
      map_link: null,
    },
    price,
    cpm,
    exposure: {
      daily_traffic: dailyImp,
      monthly_impressions: null,
      reach: null,
      frequency: null,
    },
    target_audience: item.target_demographics ?? null,
    images: imageUrls,
    tags,
    audience_tags,
    pros:
      normalizedFeatures.length > 0 ? normalizedFeatures.join(", ") : null,
    cons: null,
    trust_score: Math.min(
      95,
      65 + Math.min(30, (descLines.length + tags.length) * 2),
    ),
    additional: additionalParts.join("\n") || null,
    sampleImages: [],
    sampleDescriptions: [],
  };
}

function hasPriceInItem(item: z.infer<typeof mediaItemSchema>): boolean {
  const pm = numOrNull(item.price_per_month);
  const pw = numOrNull(item.price_per_week);
  if (pm != null && pm > 0) return true;
  if (pw != null && pw > 0) return true;
  const s = `${item.price_per_month ?? ""}${item.price_per_week ?? ""}`;
  return /[\d만천]/.test(String(s));
}

function hasNumericOrRange(raw: unknown): boolean {
  if (raw == null) return false;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return true;
  return String(raw).trim().length > 0 && /[\d]/.test(String(raw));
}

/** 추출 품질 로그 (완료율 + 누락 의심 필드) */
function logGrokExtractionQuality(
  items: z.infer<typeof mediaItemSchema>[],
  opts?: { reparse?: boolean },
): void {
  if (items.length === 0) return;
  const tag = opts?.reparse ? "[재파싱] " : "";
  let sum = 0;
  const warnings: string[] = [];
  const n = items.length;
  for (let i = 0; i < n; i++) {
    const it = items[i];
    const loc = it.location ?? {};
    const addr = resolveFullAddress(loc).trim();
    let filled = 0;
    const total = 5;
    if (it.media_name?.trim()) filled++;
    if (addr) filled++;
    if (hasPriceInItem(it)) filled++;
    if (hasNumericOrRange(it.cpm)) filled++;
    if (hasNumericOrRange(it.daily_impressions)) filled++;
    sum += filled / total;

    const label = (it.media_name ?? `항목${i + 1}`).slice(0, 48);
    if (!hasPriceInItem(it)) {
      warnings.push(`[${i + 1}/${n}] "${label}" — 가격(월/주) null·미기재 의심 (warning)`);
    }
    if (!hasNumericOrRange(it.cpm)) {
      warnings.push(`[${i + 1}/${n}] "${label}" — CPM 누락 의심 (warning)`);
    }
    if (!hasNumericOrRange(it.daily_impressions)) {
      warnings.push(`[${i + 1}/${n}] "${label}" — 일 노출(daily_impressions) 누락 의심 (warning)`);
    }
    if (!addr) {
      warnings.push(`[${i + 1}/${n}] "${label}" — 주소(full_address/구역) 누락 의심 (warning)`);
    }
  }
  const pct = Math.round((sum / n) * 100);
  console.log(
    `[grok-structured] ${tag}추출 완료: ${n}건 · 필드 충전률(평균) 약 ${pct}% (매체명·주소·가격·CPM·일노출 기준)`,
  );
  for (const w of warnings) {
    console.warn(`[grok-structured] ${tag}${w}`);
  }
  if (warnings.length === 0) {
    console.log(`[grok-structured] ${tag}누락 의심 필드: 없음 (기준 충족)`);
  }
}

function extractJson(text: string): unknown {
  const t = text.trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(t.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

const SYSTEM_PROMPT = `You are an expert Korean outdoor advertising media analyst. Extract EVERY media item from the uploaded proposal PDF with maximum accuracy.

## LOCATION FIRST (최우선)
PDF 전체를 먼저 스캔해서 **위치 정보를 최우선으로** 추출해라. 각 media_items 항목마다 **full_address, district, city, latitude, longitude**를 반드시 채워라. 주소가 명시되지 않았더라도 '현장', '위치', '설치장소', '샘플사진', '지도', '소재지', '설치위치' 키워드 근처 문장에서 추론해서 채워라.
예: '강남역 1번 출구 앞' → district: '강남구', city: '서울특별시 강남구', full_address: '서울특별시 강남구 강남대로 123 (강남역 1번 출구 앞)'.
표지·개요·매체명 옆 괄호·'설치위치'·'소재지'·'위치' 열·지도 캡처 옆 텍스트를 우선한다. **첨부 사진 캡션, '현장사진', '현장 사진', '샘플이미지', 'Location', 'ADDRESS'** 근처 문단에 주소·역명·빌딩명이 있으면 **반드시 해당 매체 location과 연계**해 채워라. 본문에 도로명이 없으면 **district + city**만이라도 채우고, full_address에는 "{시} {구} (상세주소 문서미기재)" 형태라도 넣어라. 위도·경도는 문서에 **숫자로 명시된 경우만** 넣고 추측 금지.

## Internal reasoning (do this mentally before JSON — do not print this block)
0. **주소 최우선:** 위 LOCATION FIRST 규칙을 적용해 모든 항목의 location을 채운다.
1. Treat this document as a **Korean OOH media proposal**. Preserve **all Korean terms, brand names, station names, and numbers exactly as written** (원문 유지). Do not translate Korean to English in field values.
2. Read **every page**; prioritize **tables** and **numeric columns** (CPM, 월/주 단가, 노출, 규격).
3. Split **each distinct media product** into its own object in media_items (mixed formats in one PDF → multiple items).
4. **Same medium, multiple locations** (e.g. 강남역 지하철 PSD 3개소): output **one media_items entry per location**. Distinguish **media_name** with suffix **"(강남역 1/3)"**, **"(강남역 2/3)"**, **"(강남역 3/3)"** (역·상권명 + N/M).
5. If **daily_impressions** or **cpm** is a **range** (e.g. "1.2만~1.8만", "12만~18만"): put the **median** in the numeric field and set **additional_notes** to include **"범위: 원문좌~우"** (e.g. 범위: 1.2만~1.8만). Same for price ranges in additional_notes.
6. **available_period:** Fuzzy phrases like **"즉시 ~ 3개월"**, **"즉시~6개월 이내"** → normalize to **"즉시 시작, 최대 N개월"** in the JSON string.
7. **target_demographics:** Keep **full descriptive phrases** verbatim — e.g. **"20대 여성"** plus **"강남 오피스 출퇴근자"**, **"쇼핑몰 방문자"**, **"역 환승 동선"**; do **not** collapse to age/gender only when the doc gives richer wording. Join with comma or slash if needed.
8. **Pricing rule:** If the document states **only monthly** price → **price_per_month**; **price_per_week** null or estimated. If **only weekly** → inverse. Never duplicate unless both explicit.
9. **Location:** 항상 location 객체를 채운다. full_address 우선; 없으면 city+district 조합.
10. **숫자·표·가격**은 반드시 **본문 텍스트**에서 추출하세요. (이미지 분석은 별도 단계에서 처리되므로 여기서는 **sample_image_descriptions**를 비워 두거나 텍스트에만 언급된 시각 자료가 있으면 한 줄만 적어도 됩니다.)

## Output
Output **ONLY** valid JSON — no markdown, no code fences, no commentary.

JSON shape:
{
  "media_items": [
    {
      "media_name": "string",
      "media_type": "빌보드 | 지하철 | 버스정류장 | 디지털사이니지 | 엘리베이터 | 택시 | 기타",
      "location": { "full_address", "district", "city", "latitude", "longitude" },
      "dimensions": "string",
      "daily_impressions": number,
      "cpm": number,
      "price_per_week": number or null,
      "price_per_month": number or null,
      "available_period": "string",
      "target_demographics": "string",
      "special_features": ["LED","AR","3D","디지털","모션",...],
      "contract_terms": "string",
      "sample_image_descriptions": [],
      "additional_notes": "string"
    }
  ],
  "overall_summary": "string",
  "media_owner": "string",
  "contact_info": "string"
}

Rules: latitude/longitude only if explicit in text; else null. Use 0 only for counts when truly zero; prefer null for unknown prices.

Example 1 (Gangnam billboard):
{"media_items":[{"media_name":"강남대로 코너 빌보드","media_type":"빌보드","location":{"full_address":"서울 강남구 강남대로 396","district":"강남구","city":"서울","latitude":null,"longitude":null},"dimensions":"14m x 7m","daily_impressions":320000,"cpm":12000,"price_per_week":null,"price_per_month":45000000,"available_period":"2026-04~2026-06","target_demographics":"20-40대 직장인","special_features":["야간조명","대로변"],"contract_terms":"월 단위","sample_image_descriptions":[],"additional_notes":""}],"overall_summary":"강남 핵심 상권 빌보드","media_owner":"OOH코리아","contact_info":"02-1234-5678"}

Example 2 (subway digital):
{"media_items":[{"media_name":"2호선 강남역 PSD","media_type":"디지털사이니지","location":{"full_address":"강남역 대합실","district":"강남구","city":"서울","latitude":null,"longitude":null},"dimensions":"1920x1080","daily_impressions":500000,"cpm":8500,"price_per_week":null,"price_per_month":28000000,"available_period":"2026 상반기","target_demographics":"20대 여성, 통근객","special_features":["LED","모션"],"contract_terms":"2주 단위 최소","sample_image_descriptions":[],"additional_notes":""}],"overall_summary":"지하철 디지털 패널","media_owner":"서울메트로애드","contact_info":"ad@example.com"}

Example 3 (엘리베이터+택시 혼합, CPM·가격 범위):
{"media_items":[{"media_name":"타워팰리스 A동 엘리베이터 LCD","media_type":"엘리베이터","location":{"full_address":"","district":"강남구","city":"서울특별시","latitude":null,"longitude":null},"dimensions":"21인치 세로형","daily_impressions":42000,"cpm":15000,"price_per_week":null,"price_per_month":3500000,"available_period":"2026 Q2~Q3","target_demographics":"30~50대 고소득 거주자","special_features":["디지털","모션"],"contract_terms":"월 단위 최소 3개월","sample_image_descriptions":[],"additional_notes":"CPM 표기 1.2만~1.8만원 → 중앙 1.5만원 반영"},{"media_name":"서울 슈퍼책배광 택시 루프탑","media_type":"택시","location":{"full_address":"서울 전역 순환","district":"","city":"서울","latitude":null,"longitude":null},"dimensions":"정면 패널","daily_impressions":165000,"cpm":9200,"price_per_week":1750000,"price_per_month":null,"available_period":"2026-04~05","target_demographics":"전 연령 이동 인구","special_features":["LED","3D"],"contract_terms":"2주 단위","sample_image_descriptions":[],"additional_notes":"주 단가 150만~200만원 범위 → 대표 175만원. CPM 8천~1만원대 중앙값"}],"overall_summary":"프리미엄 주거 LCD + 택시 루프탑 혼합 패키지","media_owner":"UrbanMix미디어","contact_info":"sales@urbanmix.kr"}

Example 4 (한 PDF 동일 매체·다수 소재 — media_name에 N/M 구분):
{"media_items":[{"media_name":"강남역 대합실 디지털 패널 (강남역 1/3)","media_type":"지하철","location":{"full_address":"2호선 강남역 대합실 동편","district":"강남구","city":"서울","latitude":null,"longitude":null},"dimensions":"55인치","daily_impressions":180000,"cpm":12000,"price_per_week":null,"price_per_month":22000000,"available_period":"즉시 시작, 최대 3개월","target_demographics":"20대 여성, 강남 오피스 출퇴근자, 쇼핑몰 방문자","special_features":["LED","모션"],"contract_terms":"월 단위","sample_image_descriptions":[],"additional_notes":"원문 집행기간 '즉시 ~ 3개월' 정규화"},{"media_name":"강남역 대합실 디지털 패널 (강남역 2/3)","media_type":"지하철","location":{"full_address":"2호선 강남역 대합실 서편","district":"강남구","city":"서울","latitude":null,"longitude":null},"dimensions":"55인치","daily_impressions":165000,"cpm":12000,"price_per_week":null,"price_per_month":22000000,"available_period":"즉시 시작, 최대 3개월","target_demographics":"20대 여성, 강남 오피스 출퇴근자, 쇼핑몰 방문자","special_features":["LED","모션"],"contract_terms":"월 단위","sample_image_descriptions":[],"additional_notes":""},{"media_name":"강남역 대합실 디지털 패널 (강남역 3/3)","media_type":"지하철","location":{"full_address":"신분당선 강남역 환승통로","district":"강남구","city":"서울","latitude":null,"longitude":null},"dimensions":"46인치","daily_impressions":140000,"cpm":11500,"price_per_week":null,"price_per_month":19500000,"available_period":"즉시 시작, 최대 3개월","target_demographics":"역 환승 동선, 통근객 전 연령","special_features":["디지털"],"contract_terms":"월 단위","sample_image_descriptions":[],"additional_notes":"일 노출 12만~15만 범위 → 중앙값 반영, 범위: 12만~15만"}],"overall_summary":"강남역 멀티스팟 동일 상품 3소재","media_owner":"서울트랜짓애드","contact_info":"biz@transit.kr"}

Example 5 (본문 표에 주소 없음 — 현장사진 캡션·설명에서만 주소 확보):
{"media_items":[{"media_name":"종로 낙원빌딩 전면 전광판","media_type":"디지털사이니지","location":{"full_address":"서울특별시 종로구 종로 115 낙원빌딩 외벽","district":"종로구","city":"서울특별시","latitude":null,"longitude":null},"dimensions":"15m x 10m","daily_impressions":120000,"cpm":8000,"price_per_week":null,"price_per_month":5000000,"available_period":"즉시","target_demographics":"종로 상권 방문자","special_features":["LED","전광판"],"contract_terms":"월 단위","sample_image_descriptions":["페이지 4: 서울 종로구 종로 115 낙원빌딩 앞 대형 LED 전광판 야간 촬영, 주변 전통시장 유동인구 많음"],"additional_notes":"표에는 가격만 있고 주소는 현장사진 페이지 캡션에서 추출"}],"overall_summary":"종로 핵심 전광판","media_owner":"미디어코리아","contact_info":"02-0000-0000"}

Output JSON only.`;

const RETRY_USER_KO =
  "이전 출력에 스키마 오류 또는 누락 필드가 있습니다. media_items 배열의 각 객체에 위 스키마의 모든 키를 채워(숫자는 숫자형) JSON만 반환하세요. markdown 금지.";

const VISION_SAMPLE_SYSTEM = `You analyze Korean OOH (outdoor advertising) proposal PDF page images.

For EACH image (labeled [PDF 페이지 N]):
- 매체 종류, 크기·위치·환경, 특장점(LED/AR/3D 여부, 밝기, 주변 시설·교통·상권)
- 한국어로 1~2문장씩 상세 설명

Few-shot:
- 이미지: 강남 빌보드 사진 → 설명: "서울 강남 대로변 14m x 7m LED 빌보드, 낮 시간대 촬영, 주변 카페·쇼핑몰·교통량 많음, 밝고 선명"

Output **ONLY** valid JSON (no markdown):
{
  "sample_image_descriptions": ["페이지 3: …", "페이지 5: …"],
  "best_photo_pages": [3, 5, 7]
}
Rules:
- sample_image_descriptions: one string per analyzed page; prefix with "페이지 N: " (same N as [PDF 페이지 N]).
- best_photo_pages: 1~3 integers — pages that show **actual installation / site photos** (not logos, covers, or text-only). Must be among the page numbers you were given.`;

const visionSampleSchema = z.object({
  sample_image_descriptions: z.array(z.string()).default([]),
  best_photo_pages: z.array(z.number()).default([]),
});

function visionFailureMessageInItems(items: ExtractedMediaData[]): void {
  const note = "이미지 분석 실패: PDF 원본 확인하세요";
  for (const e of items) {
    e.additional = [e.additional, `[Vision] ${note}`].filter(Boolean).join("\n");
  }
}

async function fetchVisionSampleImageAnalysis(
  cfg: ResolvedChatLlm,
  pages: PdfVisionPageImage[],
): Promise<{
  ok: boolean;
  descriptions: string[];
  bestPages: number[];
  rawText?: string;
}> {
  /** 텍스트용 XAI_MODEL과 분리 가능. xAI chat/completions + 이미지는 grok-4 권장 (구 grok-2-vision-* 폐기) */
  const visionModel =
    process.env.XAI_VISION_MODEL?.trim() || "grok-4";
  const allowed = new Set(pages.map((p) => p.pageNumber));
  const parts: ChatContentPart[] = [
    {
      type: "text",
      text:
        "이 PDF 페이지 이미지들을 분석해 매체 현장·샘플 사진 설명을 추출하세요. JSON만 출력하세요.",
    },
  ];
  for (const p of pages) {
    parts.push({ type: "text", text: `[PDF 페이지 ${p.pageNumber}]` });
    parts.push({
      type: "image_url",
      image_url: { url: `data:${p.mime};base64,${p.base64}` },
    });
  }

  let text: string;
  try {
    try {
      text = await chatCompletions(cfg, {
        temperature: 0.1,
        max_tokens: 6144,
        modelOverride: visionModel,
        messages: [
          { role: "system", content: VISION_SAMPLE_SYSTEM },
          { role: "user", content: parts },
        ],
        response_format: { type: "json_object" },
      });
    } catch (e1) {
      const msg = e1 instanceof Error ? e1.message : String(e1);
      if (
        cfg.provider === "xai" &&
        (msg.includes("400") || msg.includes("response_format"))
      ) {
        console.warn("[grok-structured] Vision json_object 거부 → 일반 모드");
        text = await chatCompletions(cfg, {
          temperature: 0.1,
          max_tokens: 6144,
          modelOverride: visionModel,
          messages: [
            { role: "system", content: VISION_SAMPLE_SYSTEM },
            { role: "user", content: parts },
          ],
        });
      } else {
        throw e1;
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(
      "[grok-structured] Vision API 실패(텍스트 추출만 사용):",
      msg.slice(0, 320),
    );
    return { ok: false, descriptions: [], bestPages: [] };
  }

  const raw = extractJson(text);
  const parsed = visionSampleSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(
      "[grok-structured] Vision JSON 파싱 실패:",
      parsed.error.flatten(),
    );
    return { ok: false, descriptions: [], bestPages: [], rawText: text };
  }

  const descriptions = parsed.data.sample_image_descriptions
    .map((s) => String(s).trim())
    .filter(Boolean);
  const bestPages = [...new Set(
    parsed.data.best_photo_pages
      .map((n) => Math.round(Number(n)))
      .filter((n) => Number.isFinite(n) && allowed.has(n)),
  )].slice(0, 3);

  return { ok: true, descriptions, bestPages, rawText: text };
}

async function mergeVisionIntoExtracted(
  cfg: ResolvedChatLlm,
  visionPages: PdfVisionPageImage[],
  items: ExtractedMediaData[],
): Promise<void> {
  if (items.length === 0) return;
  const analysis = await fetchVisionSampleImageAnalysis(cfg, visionPages);
  if (!analysis.ok) {
    visionFailureMessageInItems(items);
    return;
  }

  let uploadPages = analysis.bestPages;
  if (uploadPages.length === 0) {
    uploadPages = visionPages.slice(0, 3).map((p) => p.pageNumber);
  }

  const uploads: { buffer: Buffer; contentType: string; name: string }[] = [];
  for (const pn of uploadPages.slice(0, 3)) {
    const pg = visionPages.find((v) => v.pageNumber === pn);
    if (pg?.uploadBuffer?.length)
      uploads.push({
        buffer: pg.uploadBuffer,
        contentType: pg.mime,
        name: `page${pn}`,
      });
  }

  let sampleUrls: string[] = [];
  if (uploads.length > 0) {
    try {
      const { uploadProposalSampleImages } = await import(
        "@/lib/storage/supabase-upload"
      );
      sampleUrls = await uploadProposalSampleImages(
        uploads,
        `proposals/${Date.now()}`,
      );
    } catch (e) {
      console.warn(
        "[grok-structured] Supabase 업로드 실패:",
        e instanceof Error ? e.message : e,
      );
    }
  }

  const block =
    analysis.descriptions.length > 0
      ? `[페이지 이미지 분석]\n${analysis.descriptions.join("\n")}`
      : "";

  for (const e of items) {
    if (block) {
      e.description = [e.description, block].filter(Boolean).join("\n\n");
      e.additional = [e.additional, block].filter(Boolean).join("\n\n");
    }
    if (sampleUrls.length > 0) {
      e.sampleImages = [...new Set([...(e.sampleImages ?? []), ...sampleUrls])].slice(
        0,
        5,
      );
    }
  }
}

export async function extractStructuredProposalWithGrok(
  cfg: ResolvedChatLlm,
  documentText: string,
  adminMemo?: string,
  visionPages?: PdfVisionPageImage[],
  options?: { extraUserBlock?: string; reparse?: boolean },
): Promise<ExtractedMediaData[]> {
  const maxChars = 120_000;
  const reparseNote = options?.reparse
    ? "【재파싱 모드】검토자가 아래 힌트·스냅샷을 제공했다. PDF 본문과 **교차검증**하여 주소·가격을 보강하되, 문서에 없는 수치는 추측하지 마라. 힌트와 문서가 충돌하면 **문서 우선**, 힌트는 보조로만 쓴다.\n\n"
    : "";
  const extra = options?.extraUserBlock?.trim()
    ? `${options.extraUserBlock.trim()}\n\n---\n\n`
    : "";
  const userBody =
    reparseNote +
    extra +
    "【처리 지침】이 PDF는 한국어 옥외광고(OOH) 제안서로 간주합니다. 매체명·역명·가격·CPM·용어는 **원문 그대로** 유지하고, 표·숫자는 누락 없이 반영하세요. **location은 반드시 채운다.**\n\n" +
    (adminMemo?.trim() ? `관리자 메모: ${adminMemo.trim()}\n\n---\n\n` : "") +
    `제안서 PDF 추출 본문:\n${documentText.slice(0, maxChars)}`;

  const useJsonObject =
    cfg.provider === "xai" || cfg.provider === "openai";

  const canVision =
    cfg.provider === "xai" &&
    Array.isArray(visionPages) &&
    visionPages.length > 0 &&
    process.env.PDF_VISION_DISABLE !== "1";

  async function runChat(
    messages: ChatMessageInput[],
    attempt: number,
  ): Promise<string> {
    const temp = attempt === 0 ? 0.1 : 0;
    try {
      return await chatCompletions(cfg, {
        temperature: temp,
        max_tokens: 8192,
        messages,
        response_format: useJsonObject ? { type: "json_object" } : undefined,
      });
    } catch (e1) {
      const msg = e1 instanceof Error ? e1.message : String(e1);
      if (
        useJsonObject &&
        cfg.provider === "xai" &&
        (msg.includes("400") || msg.includes("response_format"))
      ) {
        console.warn(
          "[grok-structured] response_format json_object 거부 → 일반 모드",
        );
        return chatCompletions(cfg, {
          temperature: temp,
          max_tokens: 8192,
          messages,
        });
      }
      throw e1;
    }
  }

  let lastErr = "parse failed";
  let previousAssistant = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    let text: string;
    try {
      if (attempt === 0) {
        text = await runChat(
          [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userBody },
          ],
          0,
        );
      } else {
        text = await runChat(
          [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userBody },
            {
              role: "assistant",
              content:
                previousAssistant.slice(0, 12_000) ||
                "(empty — output full JSON again)",
            },
            { role: "user", content: RETRY_USER_KO },
          ],
          attempt,
        );
      }
    } catch (e) {
      console.error("[grok-structured] API attempt", attempt + 1, e);
      lastErr = e instanceof Error ? e.message : String(e);
      continue;
    }

    previousAssistant = text;
    const raw = extractJson(text);
    const parsed = rootSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn(
        "[grok-structured] Zod validation failed attempt",
        attempt + 1,
        parsed.error.flatten(),
      );
      lastErr = parsed.error.message;
      continue;
    }

    const { media_items, overall_summary, media_owner, contact_info } =
      parsed.data;
    const meta = { overall_summary, media_owner, contact_info };
    const extracted = media_items.map((it, i) =>
      itemToExtracted(it, i, meta, adminMemo, false),
    );

    if (canVision) {
      console.log(
        "[grok-structured] Vision 페이지:",
        visionPages!.map((v) => v.pageNumber).join(","),
      );
      await mergeVisionIntoExtracted(cfg, visionPages!, extracted);
    }

    logGrokExtractionQuality(media_items, { reparse: options?.reparse });
    return extracted;
  }

  throw new Error(
    `EXTRACT:구조화 JSON 파싱 3회 실패 — ${lastErr.slice(0, 200)}`,
  );
}
