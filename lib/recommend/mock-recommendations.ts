import type { MediaRecommendationItem } from "./types";

/** DB에 맞는 매체가 없을 때 데모용 */
export function getMockRecommendations(): MediaRecommendationItem[] {
  return [
    {
      mediaId: "demo-gangnam-led",
      name: "강남역 인근 디지털 보드 A",
      type: "DIGITAL_BOARD",
      location: "서울 강남구 강남대로",
      score: 94,
      estimatedImpressions: 2_450_000,
      priceEstimate: 18_000_000,
      isMock: true,
    },
    {
      mediaId: "demo-sinsa-billboard",
      name: "신사역 빌보드 프리미엄",
      type: "BILLBOARD",
      location: "서울 강남구 신사동",
      score: 89,
      estimatedImpressions: 1_120_000,
      priceEstimate: 22_000_000,
      isMock: true,
    },
    {
      mediaId: "demo-subway-2",
      name: "2호선 역사 PSD 패키지",
      type: "TRANSIT",
      location: "서울 지하철 2호선 주요역",
      score: 86,
      estimatedImpressions: 3_800_000,
      priceEstimate: 15_500_000,
      isMock: true,
    },
    {
      mediaId: "demo-cheonggye",
      name: "청계천 스트리트 퍼니처",
      type: "STREET_FURNITURE",
      location: "서울 종로구 청계천로",
      score: 81,
      estimatedImpressions: 890_000,
      priceEstimate: 9_200_000,
      isMock: true,
    },
  ];
}
