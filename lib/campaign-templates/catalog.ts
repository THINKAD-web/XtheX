/** UI·쿼리스트링과 동기화: 플래너 Select value와 동일해야 함 */
export type TemplateGoal = "awareness" | "launch" | "conversion" | "traffic";
export type TemplateIndustry = "fnb" | "tech" | "retail" | "auto" | "beauty" | "finance";

export type CampaignTemplateDef = {
  id: string;
  goal: TemplateGoal;
  industry: TemplateIndustry;
  /** 만 원 단위 (플래너 슬라이더와 동일) */
  budgetManwon: number;
  targetAge: "20s" | "30s" | "40+";
  region: "서울" | "도쿄" | "뉴욕" | "상하이" | "전체";
};

export const CAMPAIGN_TEMPLATE_CATALOG: CampaignTemplateDef[] = [
  {
    id: "cafe_gangnam",
    goal: "launch",
    industry: "fnb",
    budgetManwon: 3500,
    targetAge: "20s",
    region: "서울",
  },
  {
    id: "saas_tokyo",
    goal: "awareness",
    industry: "tech",
    budgetManwon: 8000,
    targetAge: "30s",
    region: "도쿄",
  },
  {
    id: "flagship_nyc",
    goal: "conversion",
    industry: "retail",
    budgetManwon: 12000,
    targetAge: "30s",
    region: "뉴욕",
  },
  {
    id: "ev_shanghai",
    goal: "launch",
    industry: "auto",
    budgetManwon: 15000,
    targetAge: "20s",
    region: "상하이",
  },
  {
    id: "beauty_seoul",
    goal: "traffic",
    industry: "beauty",
    budgetManwon: 5000,
    targetAge: "20s",
    region: "서울",
  },
  {
    id: "fintech_global",
    goal: "awareness",
    industry: "finance",
    budgetManwon: 20000,
    targetAge: "30s",
    region: "전체",
  },
  {
    id: "chain_expansion",
    goal: "conversion",
    industry: "fnb",
    budgetManwon: 6000,
    targetAge: "40+",
    region: "서울",
  },
  {
    id: "mall_weekend",
    goal: "traffic",
    industry: "retail",
    budgetManwon: 4000,
    targetAge: "20s",
    region: "서울",
  },
];

export function plannerQueryFromTemplate(t: CampaignTemplateDef): string {
  const p = new URLSearchParams();
  p.set("budget", String(t.budgetManwon));
  p.set("targetAge", t.targetAge);
  p.set("region", t.region);
  p.set("fromTemplate", t.id);
  return p.toString();
}
