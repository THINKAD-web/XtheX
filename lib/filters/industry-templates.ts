import type { AdvancedFilter } from "./schema";

export type IndustryTemplate = {
  id: string;
  nameKo: string;
  nameEn: string;
  filterJson: AdvancedFilter;
};

/**
 * 업종별 캠페인 템플릿 (태그 코드는 seed-advanced-tags / Tag 테이블과 일치해야 함)
 */
export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  beauty: {
    id: "beauty",
    nameKo: "뷰티",
    nameEn: "Beauty",
    filterJson: {
      groups: [
        { logic: "OR", tags: ["gangnam_station", "coex"] },
        { logic: "OR", tags: ["morning_rush", "evening_rush"] },
        { logic: "AND", tags: ["office_workers"] },
      ],
    },
  },
  finance: {
    id: "finance",
    nameKo: "금융",
    nameEn: "Finance",
    filterJson: {
      groups: [
        { logic: "OR", tags: ["yeouido", "gangnam_station"] },
        { logic: "OR", tags: ["morning_rush", "evening_rush"] },
        { logic: "AND", tags: ["office_workers", "high_income"] },
      ],
    },
  },
  food: {
    id: "food",
    nameKo: "F&B",
    nameEn: "F&B",
    filterJson: {
      groups: [
        { logic: "OR", tags: ["coex", "gangnam_station", "yeouido"] },
        { logic: "OR", tags: ["morning_rush", "evening_rush"] },
      ],
    },
  },
  mobility: {
    id: "mobility",
    nameKo: "모빌리티",
    nameEn: "Mobility",
    filterJson: {
      groups: [
        { logic: "OR", tags: ["gangnam_station", "yeouido", "coex"] },
        { logic: "OR", tags: ["morning_rush", "evening_rush"] },
        { logic: "AND", tags: ["office_workers"] },
      ],
    },
  },
  retail: {
    id: "retail",
    nameKo: "리테일",
    nameEn: "Retail",
    filterJson: {
      groups: [
        { logic: "OR", tags: ["coex", "gangnam_station"] },
        { logic: "OR", tags: ["evening_rush"] },
        { logic: "AND", tags: ["high_income"] },
      ],
    },
  },
};

export function getIndustryTemplateList(): IndustryTemplate[] {
  return Object.values(INDUSTRY_TEMPLATES);
}
