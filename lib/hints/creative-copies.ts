import type { CreativeHintContext } from "@/lib/hints/creatives";

export type CreativeCopy = {
  id: string;
  textKo: string;
  textEn: string;
  /** Optional 1-line execution hint (visual/format/CTA) */
  noteKo?: string;
  noteEn?: string;
};

function hasAny(ctx: CreativeHintContext, codes: string[]) {
  const set = new Set((ctx.tagCodes ?? []).filter(Boolean));
  return codes.some((c) => set.has(c));
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

type CopyRule = {
  id: string;
  priority: number;
  when: (ctx: CreativeHintContext) => boolean;
  copies: CreativeCopy[];
};

const COPY_RULES: CopyRule[] = [
  {
    id: "rainy",
    priority: 90,
    when: (ctx) => weatherIs(ctx, ["rain", "drizzle"]),
    copies: [
      {
        id: "rainy-1",
        textKo: "비 오는 날, 우산 챙기셨나요? 지금 가까운 곳에서 만나봐요.",
        textEn: "Rainy day—got an umbrella? Find us nearby, right now.",
        noteKo: "키비주얼: 우산/빗방울 + 따뜻한 포인트 컬러, CTA는 ‘지금’ 한 단어.",
        noteEn: "Visual: umbrella/raindrops + warm accent color, one-word CTA: “Now”.",
      },
      {
        id: "rainy-2",
        textKo: "오늘 같은 날엔 ‘따뜻함’이 정답. 집에 가는 길에 한 번 더 들러주세요.",
        textEn: "On days like today, comfort wins. Drop by on your way home.",
        noteKo: "구성: 제품 1장 + ‘따뜻함’ 키워드 1개 + 로고 고정(리콜).",
        noteEn: "Layout: one product shot + one comfort keyword + strong logo lockup.",
      },
      {
        id: "rainy-3",
        textKo: "빗길 안전 + 혜택 한 줄로 끝. 지금 바로 확인!",
        textEn: "Rainy-day safety + a deal in one line. Check it now!",
        noteKo: "형식: 숫자 혜택(₩/%) 크게 + 짧은 헤드라인(3–5단어).",
        noteEn: "Format: big numeric offer (₩/%) + 3–5 word headline.",
      },
    ],
  },
  {
    id: "morning-commute",
    priority: 80,
    when: (ctx) => inHours(ctx, [[7, 10]]) || hasAny(ctx, ["morning_rush"]),
    copies: [
      {
        id: "morning-1",
        textKo: "출근길 3초 요약: 오늘만 혜택, 지금 바로.",
        textEn: "3-second commute summary: today-only deal, right now.",
        noteKo: "헤드라인은 1줄, 혜택 숫자만 크게(시야 짧음 대응).",
        noteEn: "One-line headline; emphasize the numeric offer for fast scanning.",
      },
      {
        id: "morning-2",
        textKo: "오늘 아침을 바꾸는 한 가지. 지금 가까운 곳에서.",
        textEn: "One thing to upgrade your morning. Nearby, right now.",
        noteKo: "모션: 2–3초 루프(미세 움직임) + 마지막 로고 고정.",
        noteEn: "Motion: subtle 2–3s loop + final-frame logo lockup.",
      },
      {
        id: "morning-3",
        textKo: "지금 이 순간에 딱 맞는 선택. 빠르게 확인하세요.",
        textEn: "The right choice for this moment. Check fast.",
        noteKo: "CTA는 ‘지금/오늘’처럼 시간 단어로 컨텍스트 강화.",
        noteEn: "Use time words like “now/today” to boost context match.",
      },
    ],
  },
  {
    id: "evening",
    priority: 78,
    when: (ctx) => inHours(ctx, [[17, 21]]) || hasAny(ctx, ["evening_rush"]),
    copies: [
      {
        id: "evening-1",
        textKo: "퇴근길 10분 거리. 오늘 혜택은 지금 끝!",
        textEn: "10 minutes from your commute. Deal ends today—now!",
        noteKo: "요소: 거리/지도 아이콘 + ‘마감’ 키워드로 즉시 행동 유도.",
        noteEn: "Add: distance/map cue + urgency word like “Ends today”.",
      },
      {
        id: "evening-2",
        textKo: "지금 들르면 더 이득. 가까운 매장에서 확인하세요.",
        textEn: "More value if you stop by now. Check the nearest spot.",
        noteKo: "쿠폰 코드/QR 같은 실행 요소를 크게 배치.",
        noteEn: "Make an action element big: coupon code or QR.",
      },
      {
        id: "evening-3",
        textKo: "오늘 하루 마무리, 작은 보상 하나. 지금 바로.",
        textEn: "Wrap your day with a small reward. Right now.",
        noteKo: "따뜻한 비주얼 톤 + ‘보상/리워드’ 단어로 감정 트리거.",
        noteEn: "Warm visuals + reward language to trigger emotion.",
      },
    ],
  },
  {
    id: "default",
    priority: 0,
    when: () => true,
    copies: [
      {
        id: "default-1",
        textKo: "짧게, 강하게: 한 줄로 끝내는 메시지. 지금 확인!",
        textEn: "Short and strong: one-line message. Check now!",
        noteKo: "기본 공식: 강한 비주얼 1개 + 헤드라인 1줄 + 로고.",
        noteEn: "Baseline formula: one hero visual + one headline + logo.",
      },
      {
        id: "default-2",
        textKo: "가까운 곳에서 더 쉽게. 오늘 바로 경험해보세요.",
        textEn: "Easier when it’s nearby. Try it today.",
        noteKo: "근접성(‘가까움’)을 숫자/랜드마크로 구체화하면 효과↑.",
        noteEn: "Make proximity concrete with a number or landmark for stronger effect.",
      },
      {
        id: "default-3",
        textKo: "지금 이 컨텍스트에 딱 맞는 제안. 클릭 한 번으로.",
        textEn: "A perfect fit for this context. One click away.",
        noteKo: "‘지금/오늘’ 키워드 + CTA 1단어로 단순화.",
        noteEn: "Use “now/today” + a one-word CTA to keep it simple.",
      },
    ],
  },
];

export function getCreativeCopySuggestions(ctx: CreativeHintContext, limit = 3): CreativeCopy[] {
  const matched = COPY_RULES.filter((r) => {
    try {
      return r.when(ctx);
    } catch {
      return false;
    }
  }).sort((a, b) => b.priority - a.priority);

  const seen = new Set<string>();
  const out: CreativeCopy[] = [];
  for (const rule of matched) {
    for (const c of rule.copies) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
      if (out.length >= limit) return out;
    }
  }
  return out.slice(0, limit);
}

