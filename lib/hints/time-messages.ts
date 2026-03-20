export type TimeMessageContext = {
  tagCodes: string[];
  hour?: number;
};

export type TimeMessageHint = {
  id: string;
  titleKo: string;
  titleEn: string;
  bodyKo: string;
  bodyEn: string;
  priority: number;
};

type Rule = {
  id: string;
  priority: number;
  when: (ctx: TimeMessageContext) => boolean;
  hint: Omit<TimeMessageHint, "priority">;
};

function hasTag(ctx: TimeMessageContext, code: string) {
  return (ctx.tagCodes ?? []).includes(code);
}

function inHours(ctx: TimeMessageContext, ranges: Array<[number, number]>) {
  const h = ctx.hour;
  if (typeof h !== "number") return false;
  return ranges.some(([start, end]) => h >= start && h < end);
}

const RULES: Rule[] = [
  {
    id: "morning_rush_message",
    priority: 90,
    when: (ctx) => hasTag(ctx, "morning_rush") || inHours(ctx, [[7, 10]]),
    hint: {
      id: "morning_rush_message",
      titleKo: "출근길 메시지 추천",
      titleEn: "Morning commute message",
      bodyKo: "출근길: “오늘 하루 화이팅!” 같은 짧은 응원/에너지 메시지가 컨텍스트 매칭이 좋아요.",
      bodyEn: "Morning commute: short uplifting copy like “You’ve got this today!” fits the context well.",
    },
  },
  {
    id: "evening_rush_message",
    priority: 85,
    when: (ctx) => hasTag(ctx, "evening_rush") || inHours(ctx, [[17, 21]]),
    hint: {
      id: "evening_rush_message",
      titleKo: "퇴근 후 메시지 추천",
      titleEn: "After-work message",
      bodyKo: "퇴근 후: “퇴근 후 여유롭게”처럼 휴식/보상 톤을 쓰면 반응이 좋아집니다.",
      bodyEn: "After work: a comfort/reward tone like “Relax after work” tends to perform better.",
    },
  },
];

export function getTimeMessageHints(ctx: TimeMessageContext): TimeMessageHint[] {
  const seen = new Set<string>();
  const hints = RULES.filter((r) => {
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

  return hints.slice(0, 1);
}

