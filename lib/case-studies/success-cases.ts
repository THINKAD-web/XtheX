import type { AdvancedFilter } from "@/lib/filters/schema";

export type SuccessCase = {
  id: string;
  titleKo: string;
  titleEn: string;
  industryKo: string;
  industryEn: string;
  summaryKo: string;
  summaryEn: string;
  kpiKo: string;
  kpiEn: string;
  images: string[];
  filterJson: AdvancedFilter;
};

export const SUCCESS_CASES: SuccessCase[] = [
  {
    id: "gangnam_beauty_launch",
    titleKo: "강남 뷰티 신제품 런칭",
    titleEn: "Gangnam beauty launch",
    industryKo: "뷰티",
    industryEn: "Beauty",
    summaryKo: "강남역 중심 유동 + 출퇴근 타임을 노린 DOOH 집중 집행 후 카카오로 리타겟팅.",
    summaryEn: "DOOH concentrated around Gangnam Station + commuter hours, followed by Kakao retargeting.",
    kpiKo: "리드 +42% (데모)",
    kpiEn: "Leads +42% (demo)",
    images: [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1520975958225-2c9f3a45a421?auto=format&fit=crop&w=1200&q=60",
    ],
    filterJson: {
      groups: [
        { id: "g1", label: "위치 / 상권", logic: "OR", tags: ["gangnam_station"] },
        { id: "g2", label: "시간 / 컨텍스트", logic: "OR", tags: ["morning_rush", "evening_rush"] },
        { id: "g3", label: "추가 조건", logic: "OR", tags: ["twenties", "thirties", "high_income", "premium"] },
      ],
    },
  },
  {
    id: "yeouido_finance_trust",
    titleKo: "여의도 금융 신뢰도 캠페인",
    titleEn: "Yeouido finance trust campaign",
    industryKo: "금융",
    industryEn: "Finance",
    summaryKo: "오피스/출퇴근 동선에서 숫자 혜택 + 신뢰 톤으로 반복 노출.",
    summaryEn: "Repeated exposure with numeric offer + trust tone in office commuter routes.",
    kpiKo: "CTR +18% (데모)",
    kpiEn: "CTR +18% (demo)",
    images: [
      "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=60",
    ],
    filterJson: {
      groups: [
        { id: "g1", label: "위치 / 상권", logic: "OR", tags: ["yeouido"] },
        { id: "g2", label: "시간 / 컨텍스트", logic: "OR", tags: ["morning_rush", "evening_rush"] },
        { id: "g3", label: "추가 조건", logic: "OR", tags: ["office_workers", "high_income", "premium"] },
      ],
    },
  },
  {
    id: "coex_retail_weekend",
    titleKo: "코엑스 리테일 주말 프로모션",
    titleEn: "COEX retail weekend promo",
    industryKo: "리테일",
    industryEn: "Retail",
    summaryKo: "주말 가족/쇼핑 수요를 타겟팅해 쿠폰/QR CTA로 전환.",
    summaryEn: "Weekend family/shopping targeting with coupon/QR CTA for conversion.",
    kpiKo: "QR 스캔 +2.1x (데모)",
    kpiEn: "QR scans +2.1x (demo)",
    images: [
      "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=1200&q=60",
    ],
    filterJson: {
      groups: [
        { id: "g1", label: "위치 / 상권", logic: "OR", tags: ["coex"] },
        { id: "g2", label: "시간 / 컨텍스트", logic: "OR", tags: ["weekend"] },
        { id: "g3", label: "추가 조건", logic: "OR", tags: ["families", "shopping_mall_visitors"] },
      ],
    },
  },
  {
    id: "hongdae_fnb_trendy",
    titleKo: "홍대 F&B 트렌디 런칭",
    titleEn: "Hongdae F&B trendy launch",
    industryKo: "F&B",
    industryEn: "F&B",
    summaryKo: "밈/컬러 톤의 짧은 메시지 + IG 릴스 연계로 확산.",
    summaryEn: "Meme/color punchy copy + IG Reels for amplification.",
    kpiKo: "저장/공유 +35% (데모)",
    kpiEn: "Saves/shares +35% (demo)",
    images: [
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=1200&q=60",
    ],
    filterJson: {
      groups: [
        { id: "g1", label: "위치 / 상권", logic: "OR", tags: ["hongdae_trendy"] },
        { id: "g2", label: "시간 / 컨텍스트", logic: "OR", tags: ["evening_rush", "nightlife"] },
        { id: "g3", label: "추가 조건", logic: "OR", tags: ["teens", "twenties", "couples"] },
      ],
    },
  },
  {
    id: "rainy_day_mobility",
    titleKo: "우천 컨텍스트 모빌리티 캠페인",
    titleEn: "Rainy-context mobility campaign",
    industryKo: "모빌리티",
    industryEn: "Mobility",
    summaryKo: "우천/안전 메시지로 컨텍스트 매칭을 강화하고 카카오 메시지로 전환.",
    summaryEn: "Context-match on rain/safety messaging, convert via Kakao messaging.",
    kpiKo: "전환율 +24% (데모)",
    kpiEn: "CVR +24% (demo)",
    images: [
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1516298772297-1a736d4f3665?auto=format&fit=crop&w=1200&q=60",
    ],
    filterJson: {
      groups: [
        { id: "g1", label: "시간 / 컨텍스트", logic: "OR", tags: ["rainy_day"] },
        { id: "g2", label: "추가 조건", logic: "OR", tags: ["office_workers", "twenties"] },
      ],
    },
  },
  {
    id: "premium_minimal",
    titleKo: "프리미엄 미니멀 브랜딩",
    titleEn: "Premium minimal branding",
    industryKo: "럭셔리",
    industryEn: "Luxury",
    summaryKo: "최소 텍스트 + 고급 비주얼 1장으로 리콜 중심 집행.",
    summaryEn: "Recall-first execution with minimal copy + one premium hero visual.",
    kpiKo: "브랜드 리콜 +15% (데모)",
    kpiEn: "Brand recall +15% (demo)",
    images: [
      "https://images.unsplash.com/photo-1520975682031-a59f4b8d6a75?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1514997130083-3e8f32b2d65a?auto=format&fit=crop&w=1200&q=60",
    ],
    filterJson: {
      groups: [
        { id: "g1", label: "추가 조건", logic: "OR", tags: ["high_income", "luxury", "premium"] },
      ],
    },
  },
];

