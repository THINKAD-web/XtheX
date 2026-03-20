export type DoohOnboardingStep = {
  id: "industry" | "targeting" | "budget" | "create";
  titleKo: string;
  titleEn: string;
  bodyKo: string;
  bodyEn: string;
  /** Joyride target selector (optional) */
  target?: string;
};

/**
 * Joyride 설정 배열로도 그대로 쓸 수 있게 구성.
 * target은 나중에 실제 버튼/입력에 data-attr 붙이면 연결 가능.
 */
export const DOOH_CAMPAIGN_ONBOARDING_STEPS: DoohOnboardingStep[] = [
  {
    id: "industry",
    titleKo: "1) 업종 선택",
    titleEn: "1) Pick an industry",
    bodyKo:
      "뷰티/금융/F&B 같은 업종 템플릿을 선택하면, 추천 타겟팅이 자동으로 채워져요.",
    bodyEn:
      "Choose an industry template to auto-fill recommended targeting.",
    target: "[data-onboarding='industry']",
  },
  {
    id: "targeting",
    titleKo: "2) 위치/시간 필터",
    titleEn: "2) Location & time",
    bodyKo:
      "강남/여의도/출퇴근 같은 조건을 추가해요. 선택한 상권은 미니맵으로 바로 확인됩니다.",
    bodyEn:
      "Add tags like Gangnam/Yeouido/rush hours. Selected POIs show up on the mini map.",
    target: "[data-onboarding='targeting']",
  },
  {
    id: "budget",
    titleKo: "3) 예산 입력",
    titleEn: "3) Set budget",
    bodyKo:
      "예산을 입력하면 예상 노출/CPM/클릭 같은 성과를 빠르게 가늠할 수 있어요. (룰 기반)",
    bodyEn:
      "Set a budget to estimate impressions/CPM/clicks quickly (rule-based).",
    target: "[data-onboarding='budget']",
  },
  {
    id: "create",
    titleKo: "4) 생성",
    titleEn: "4) Create",
    bodyKo:
      "필터/번들 조합으로 ‘옴니채널 캠페인에 담기’를 눌러 캠페인 초안을 저장하세요.",
    bodyEn:
      "Save your campaign draft via 'Add to omnichannel campaign' using filters/bundles.",
    target: "[data-onboarding='create']",
  },
];

