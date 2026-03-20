export type AbVariant = {
  id: string;
  labelKo: string;
  labelEn: string;
  textKo: string;
  textEn: string;
};

export type AbVariantContext = {
  tagCodes: string[];
};

type Rule = {
  id: string;
  priority: number;
  when: (ctx: AbVariantContext) => boolean;
  variants: AbVariant[];
};

function hasAny(ctx: AbVariantContext, codes: string[]) {
  const set = new Set((ctx.tagCodes ?? []).filter(Boolean));
  return codes.some((c) => set.has(c));
}

const RULES: Rule[] = [
  {
    id: "luxury_high_income",
    priority: 90,
    when: (ctx) => hasAny(ctx, ["high_income", "premium", "luxury"]),
    variants: [
      {
        id: "premium",
        labelKo: "프리미엄 ver",
        labelEn: "Premium ver",
        textKo: "프리미엄의 기준을 바꾸다. 오늘, 단 하나의 선택.",
        textEn: "Redefine premium. One choice, today.",
      },
      {
        id: "emotional",
        labelKo: "감성 ver",
        labelEn: "Emotional ver",
        textKo: "당신의 하루에 조용히 스며드는 작은 여유.",
        textEn: "A quiet luxury that fits your day.",
      },
      {
        id: "discount",
        labelKo: "할인 ver",
        labelEn: "Discount ver",
        textKo: "프리미엄을 더 가볍게. 오늘만 혜택을 확인하세요.",
        textEn: "Premium, made easier. Check today’s offer.",
      },
    ],
  },
  {
    id: "commute_office",
    priority: 80,
    when: (ctx) => hasAny(ctx, ["office_workers", "morning_rush", "evening_rush"]),
    variants: [
      {
        id: "value",
        labelKo: "혜택 ver",
        labelEn: "Value ver",
        textKo: "출퇴근 3초 요약: 오늘만 혜택, 지금 확인!",
        textEn: "3-sec commute summary: today-only deal, now.",
      },
      {
        id: "proximity",
        labelKo: "근처 ver",
        labelEn: "Nearby ver",
        textKo: "지금 10분 거리. 퇴근길에 바로 들러보세요.",
        textEn: "10 minutes away. Stop by on your way home.",
      },
      {
        id: "trust",
        labelKo: "신뢰 ver",
        labelEn: "Trust ver",
        textKo: "바쁜 하루일수록, 확실한 선택이 필요합니다.",
        textEn: "When you’re busy, you need the sure choice.",
      },
    ],
  },
  {
    id: "youth_trendy",
    priority: 75,
    when: (ctx) => hasAny(ctx, ["twenties", "teens", "hongdae_trendy", "trendy"]),
    variants: [
      {
        id: "meme",
        labelKo: "밈/위트 ver",
        labelEn: "Meme ver",
        textKo: "이거 안 하면 손해. 지금 바로 가자.",
        textEn: "If you skip this, you lose. Let’s go now.",
      },
      {
        id: "short",
        labelKo: "짧고 강하게 ver",
        labelEn: "Punchy ver",
        textKo: "딱 한 줄이면 끝. 지금 확인!",
        textEn: "One line. That’s it. Check now!",
      },
      {
        id: "cta",
        labelKo: "CTA ver",
        labelEn: "CTA ver",
        textKo: "지금 저장 → 나중에 후회 금지.",
        textEn: "Save now → no regrets later.",
      },
    ],
  },
  {
    id: "default",
    priority: 0,
    when: () => true,
    variants: [
      {
        id: "brand",
        labelKo: "브랜딩 ver",
        labelEn: "Branding ver",
        textKo: "한 번 보면 기억나는 브랜드. 오늘부터 시작.",
        textEn: "A brand you remember. Start today.",
      },
      {
        id: "benefit",
        labelKo: "혜택 ver",
        labelEn: "Benefit ver",
        textKo: "오늘만 더 좋은 조건. 지금 확인하세요.",
        textEn: "Better terms today. Check now.",
      },
      {
        id: "simple",
        labelKo: "심플 ver",
        labelEn: "Simple ver",
        textKo: "짧게, 강하게, 한 줄로.",
        textEn: "Short. Strong. One line.",
      },
    ],
  },
];

export function getAbMessageVariants(ctx: AbVariantContext): AbVariant[] {
  const rule = RULES
    .filter((r) => {
      try {
        return r.when(ctx);
      } catch {
        return false;
      }
    })
    .sort((a, b) => b.priority - a.priority)[0];

  return rule?.variants?.slice(0, 3) ?? [];
}

