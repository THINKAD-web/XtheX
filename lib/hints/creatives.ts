export type CreativeHint = {
  id: string;
  titleKo: string;
  titleEn: string;
  bodyKo: string;
  bodyEn: string;
  priority: number; // higher = more important
  tags?: string[];
};

export type CreativeHintContext = {
  /** Advanced targeting tag codes (e.g. office_workers, high_income, morning_rush) */
  tagCodes?: string[];
  /** Free-text target/audience from Media */
  targetAudienceText?: string | null;
  /** Media category or name for keyword heuristics */
  mediaName?: string;
  mediaCategory?: string;
  /** Weather main from OpenWeather (e.g. Rain, Clear, Clouds) */
  weatherMain?: string;
  /** Local hour (0-23) to apply daypart rules */
  hour?: number;
};

type Rule = {
  id: string;
  priority: number;
  when: (ctx: CreativeHintContext) => boolean;
  hint: Omit<CreativeHint, "priority">;
};

function hasAnyTag(ctx: CreativeHintContext, codes: string[]) {
  const set = new Set((ctx.tagCodes ?? []).filter(Boolean));
  return codes.some((c) => set.has(c));
}

function textIncludes(ctx: CreativeHintContext, keywords: string[]) {
  const combined = `${ctx.targetAudienceText ?? ""} ${ctx.mediaName ?? ""} ${ctx.mediaCategory ?? ""}`.toLowerCase();
  return keywords.some((k) => combined.includes(k.toLowerCase()));
}

function weatherIs(ctx: CreativeHintContext, mains: string[]) {
  const m = (ctx.weatherMain ?? "").toLowerCase();
  return mains.some((x) => m.includes(x.toLowerCase()));
}

function inHours(ctx: CreativeHintContext, ranges: Array<[number, number]>) {
  const h = ctx.hour;
  if (typeof h !== "number") return false;
  return ranges.some(([start, end]) => h >= start && h < end);
}

const RULES: Rule[] = [
  {
    id: "rainy_day_message_umbrella",
    priority: 96,
    when: (ctx) => weatherIs(ctx, ["rain", "drizzle"]),
    hint: {
      id: "rainy_day_message_umbrella",
      titleKo: "비 오는 날 메시지 추천",
      titleEn: "Rainy-day message suggestion",
      bodyKo: "비 오는 날 메시지 추천: 우산 들고 오세요~ 같은 한 줄 카피를 전면에 두면 클릭/리드 전환이 좋아집니다.",
      bodyEn:
        "Rainy-day copy idea: lead with a one-liner like “Don’t forget your umbrella~” to match context and improve response.",
      tags: ["weather", "copy", "context"],
    },
  },
  {
    id: "location_gangnam_premium",
    priority: 84,
    when: (ctx) => textIncludes(ctx, ["강남", "강남역", "코엑스", "여의도", "gangnam", "coex", "yeouido"]),
    hint: {
      id: "location_gangnam_premium",
      titleKo: "서울 핵심 상권: 프리미엄 톤",
      titleEn: "Seoul hotspots: premium tone",
      bodyKo:
        "강남·여의도·코엑스권은 '프리미엄/신뢰' 톤이 잘 맞습니다. 과한 문구보다 브랜드·제품 퀄리티 중심(짧은 카피 + 강한 비주얼)을 추천합니다.",
      bodyEn:
        "Gangnam/Yeouido/COEX favor premium and trust cues. Keep copy short and let a strong hero visual carry the message.",
      tags: ["location", "premium", "trust"],
    },
  },
  {
    id: "location_hongdae_trendy",
    priority: 83,
    when: (ctx) => textIncludes(ctx, ["홍대", "hongdae", "street", "패션", "f&b", "카페"]),
    hint: {
      id: "location_hongdae_trendy",
      titleKo: "홍대/트렌디 상권: 밈/컬러",
      titleEn: "Trendy areas: meme & color",
      bodyKo:
        "트렌디 상권은 강한 컬러 대비 + 위트 있는 한 줄 카피가 좋습니다. 제품보다 '분위기'를 먼저 보여주고, 해시태그/짧은 CTA로 마무리하세요.",
      bodyEn:
        "Trendy areas reward bold color contrast and witty one-liners. Lead with vibe, end with a short CTA or hashtag.",
      tags: ["location", "trendy", "color"],
    },
  },
  {
    id: "daypart_morning_commute",
    priority: 88,
    when: (ctx) =>
      inHours(ctx, [[7, 10]]) || hasAnyTag(ctx, ["morning_rush"]),
    hint: {
      id: "daypart_morning_commute",
      titleKo: "출근 시간: '오늘 아침' 메시지",
      titleEn: "Morning commute: 'this morning' message",
      bodyKo:
        "출근 시간대에는 '오늘/지금' 컨텍스트가 잘 먹습니다. 커피·간편식·모빌리티·금융(출근길 결제/혜택) 메시지를 1줄로 강하게 추천합니다.",
      bodyEn:
        "Morning commute favors 'today/now' context. Use a single strong line for coffee, convenience food, mobility, or finance offers.",
      tags: ["daypart", "morning", "now"],
    },
  },
  {
    id: "daypart_evening_impulse",
    priority: 86,
    when: (ctx) =>
      inHours(ctx, [[17, 21]]) || hasAnyTag(ctx, ["evening_rush"]),
    hint: {
      id: "daypart_evening_impulse",
      titleKo: "퇴근 시간: 즉시 행동 유도",
      titleEn: "Evening: drive immediate action",
      bodyKo:
        "퇴근 시간대는 '지금 10분 거리' 같은 근접성과 혜택이 강합니다. 지도/거리/쿠폰 코드 같은 실행 요소를 크게 배치하세요.",
      bodyEn:
        "Evening commute works with proximity and deals. Show distance, map cues, or a coupon code prominently.",
      tags: ["daypart", "proximity", "deal"],
    },
  },
  {
    id: "youth_short_video",
    priority: 90,
    when: (ctx) =>
      textIncludes(ctx, ["10대", "20대", "MZ", "Z세대", "대학생", "teen", "twent"]) ||
      hasAnyTag(ctx, ["evening_rush"]),
    hint: {
      id: "youth_short_video",
      titleKo: "젊은 층: 짧고 빠른 영상",
      titleEn: "Youth: short & punchy video",
      bodyKo:
        "TikTok 스타일의 6–10초 루프 영상(강한 첫 1초), 밝은 색상·큰 타이포를 추천합니다. 메시지는 1줄로, CTA는 한 단어로 정리하세요.",
      bodyEn:
        "Use 6–10s looping video with a strong first second. Bright colors, big type, one-line message, and a single-word CTA work best.",
      tags: ["video", "loop", "bold-type"],
    },
  },
  {
    id: "office_clear_value",
    priority: 85,
    when: (ctx) =>
      hasAnyTag(ctx, ["office_workers", "morning_rush", "evening_rush"]) ||
      textIncludes(ctx, ["직장인", "출퇴근", "office", "commut"]),
    hint: {
      id: "office_clear_value",
      titleKo: "직장인/출퇴근: 3초 안에 이해",
      titleEn: "Commuters: understood in 3 seconds",
      bodyKo:
        "출퇴근 동선에서는 시야가 짧습니다. 가격/혜택 숫자(예: 30%·₩9,900) + 제품 이미지 1개 + 짧은 헤드라인 구조를 추천합니다.",
      bodyEn:
        "Commuters have short attention windows. Use a bold numeric offer + one product image + short headline.",
      tags: ["offer", "numbers", "fast-read"],
    },
  },
  {
    id: "high_income_luxury_minimal",
    priority: 95,
    when: (ctx) =>
      hasAnyTag(ctx, ["high_income"]) || textIncludes(ctx, ["고소득", "프리미엄", "luxury", "premium"]),
    hint: {
      id: "high_income_luxury_minimal",
      titleKo: "프리미엄: 최소 텍스트, 고급 이미지",
      titleEn: "Luxury: minimal text, premium visual",
      bodyKo:
        "텍스트를 최소화하고(로고+태그라인 수준), 고급 제품/모델 컷 1장으로 통일감을 주세요. 배경은 딥톤/모노톤이 잘 먹습니다.",
      bodyEn:
        "Keep text minimal (logo + tagline). Use a single premium hero visual with deep/mono tones for a luxury feel.",
      tags: ["minimal", "premium", "mono"],
    },
  },
  {
    id: "rainy_day_warmth",
    priority: 80,
    when: (ctx) => weatherIs(ctx, ["rain", "drizzle"]),
    hint: {
      id: "rainy_day_warmth",
      titleKo: "비 오는 날: 따뜻함/보호 메시지",
      titleEn: "Rainy day: warmth & comfort",
      bodyKo:
        "우산·따뜻함·보호(방수/보온/안전) 키워드를 전면에 두면 컨텍스트 매칭이 좋아집니다. 배경은 차가운 톤, 메시지는 따뜻한 톤 대비를 추천합니다.",
      bodyEn:
        "Lean into comfort/safety keywords (umbrella, warmth, protection). Contrast a cool background with warm accents.",
      tags: ["context", "weather", "comfort"],
    },
  },
  {
    id: "default_motion_logo",
    priority: 10,
    when: () => true,
    hint: {
      id: "default_motion_logo",
      titleKo: "기본: 모션 + 로고 리콜",
      titleEn: "Baseline: motion + brand recall",
      bodyKo:
        "DOOH는 모션이 강점입니다. 2–3초마다 미세한 움직임(빛, 패럴랙스, 카운트업) + 마지막 프레임 로고 고정으로 리콜을 높이세요.",
      bodyEn:
        "DOOH shines with subtle motion. Add micro-animations every 2–3 seconds and end with a strong logo lockup for recall.",
      tags: ["motion", "logo"],
    },
  },
];

export function getCreativeHints(ctx: CreativeHintContext): CreativeHint[] {
  const seen = new Set<string>();
  const hints = RULES
    .filter((r) => {
      try {
        return r.when(ctx);
      } catch {
        return false;
      }
    })
    .sort((a, b) => b.priority - a.priority)
    .map((r) => ({ ...r.hint, priority: r.priority }))
    .filter((h) => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    });

  return hints.slice(0, 3); // top 3
}

