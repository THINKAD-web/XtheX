export type OmnichannelContext = {
  tagCodes: string[];
  budgetKrw: number;
};

export type OmnichannelPackage = {
  id: string;
  titleKo: string;
  titleEn: string;
  bulletsKo: string[];
  bulletsEn: string[];
  allocation: { dooh: number; kakao: number; ig: number }; // fractions sum ~= 1
};

function hasAny(tags: string[], codes: string[]) {
  const set = new Set(tags);
  return codes.some((c) => set.has(c));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function budgetTier(budgetKrw: number): "low" | "mid" | "high" {
  if (budgetKrw >= 30000000) return "high";
  if (budgetKrw >= 10000000) return "mid";
  return "low";
}

export function getOmnichannelPackages(ctx: OmnichannelContext): OmnichannelPackage[] {
  const tags = ctx.tagCodes ?? [];
  const tier = budgetTier(ctx.budgetKrw);

  const base: OmnichannelPackage[] = [
    {
      id: "dooh_kakao_retarget",
      titleKo: "DOOH + 카카오 리타겟팅 패키지",
      titleEn: "DOOH + Kakao retargeting package",
      bulletsKo: [
        "DOOH로 인지 확보 → 카카오로 혜택/쿠폰 메시지 전환",
        "출퇴근/오피스 태그가 있으면 카카오 비중을 올리면 효율적",
      ],
      bulletsEn: [
        "Build awareness with DOOH → convert with Kakao coupon/message",
        "If commuter/office targeting is selected, increase Kakao share for efficiency",
      ],
      allocation:
        tier === "low"
          ? { dooh: 0.55, kakao: 0.35, ig: 0.10 }
          : tier === "mid"
            ? { dooh: 0.60, kakao: 0.30, ig: 0.10 }
            : { dooh: 0.62, kakao: 0.28, ig: 0.10 },
    },
    {
      id: "dooh_ig_reels",
      titleKo: "DOOH + 인스타/릴스 크리에이티브 패키지",
      titleEn: "DOOH + IG/Reels creative package",
      bulletsKo: [
        "6–10초 루프 영상(릴스/쇼츠) 톤을 DOOH에 그대로 확장",
        "젊은층/트렌디 상권이면 IG 비중을 올리면 반응이 좋아요",
      ],
      bulletsEn: [
        "Extend 6–10s looping Reels/Shorts creative to DOOH",
        "If youth/trendy targeting is selected, increase IG share for better engagement",
      ],
      allocation:
        tier === "low"
          ? { dooh: 0.60, kakao: 0.10, ig: 0.30 }
          : tier === "mid"
            ? { dooh: 0.62, kakao: 0.08, ig: 0.30 }
            : { dooh: 0.65, kakao: 0.05, ig: 0.30 },
    },
  ];

  // tag-based prioritization
  const prioritized: OmnichannelPackage[] = [];
  const rest: OmnichannelPackage[] = [];

  for (const p of base) {
    if (p.id === "dooh_kakao_retarget" && hasAny(tags, ["office_workers", "morning_rush", "evening_rush"])) {
      prioritized.push(p);
      continue;
    }
    if (p.id === "dooh_ig_reels" && hasAny(tags, ["twenties", "teens", "hongdae_trendy"])) {
      prioritized.push(p);
      continue;
    }
    if (p.id === "dooh_ig_reels" && hasAny(tags, ["high_income"])) {
      // premium audiences still work with IG, but keep DOOH strong
      prioritized.push({
        ...p,
        id: "dooh_ig_premium",
        titleKo: "DOOH + 인스타 프리미엄 패키지",
        titleEn: "DOOH + IG premium package",
        bulletsKo: [
          "프리미엄 비주얼(최소 텍스트)로 DOOH 리콜 강화",
          "IG는 룩/무드 중심 크리에이티브로 ‘저장/공유’ 유도",
        ],
        bulletsEn: [
          "Reinforce recall with premium visuals (minimal copy) on DOOH",
          "Use IG mood/visual creatives to drive saves and shares",
        ],
        allocation: tier === "high" ? { dooh: 0.70, kakao: 0.05, ig: 0.25 } : { dooh: 0.68, kakao: 0.07, ig: 0.25 },
      });
      continue;
    }
    rest.push(p);
  }

  const out = [...prioritized, ...rest];
  // de-dupe by id
  const seen = new Set<string>();
  return out.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true))).slice(0, 3);
}

export function estimateOmnichannelReach(ctx: OmnichannelContext, allocation: { dooh: number; kakao: number; ig: number }) {
  // Extremely simple heuristic model (demo):
  // - CPM assumptions (KRW): DOOH 9000, Kakao 3500, IG 4500
  // - Reach factor: DOOH 0.55 (repetition), Kakao 0.35, IG 0.40
  const budget = Math.max(0, ctx.budgetKrw || 0);
  const doohBudget = budget * clamp(allocation.dooh, 0, 1);
  const kakaoBudget = budget * clamp(allocation.kakao, 0, 1);
  const igBudget = budget * clamp(allocation.ig, 0, 1);

  const impressions = {
    dooh: doohBudget > 0 ? (doohBudget / 9000) * 1000 : 0,
    kakao: kakaoBudget > 0 ? (kakaoBudget / 3500) * 1000 : 0,
    ig: igBudget > 0 ? (igBudget / 4500) * 1000 : 0,
  };

  const reach = {
    dooh: impressions.dooh * 0.55,
    kakao: impressions.kakao * 0.35,
    ig: impressions.ig * 0.40,
  };

  const totalReach = reach.dooh + reach.kakao + reach.ig;
  const totalImpressions = impressions.dooh + impressions.kakao + impressions.ig;

  return {
    budget,
    impressions,
    reach,
    totalImpressions,
    totalReach,
  };
}

