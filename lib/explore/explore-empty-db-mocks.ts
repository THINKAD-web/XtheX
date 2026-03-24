import { MediaCategory } from "@prisma/client";

export type ExploreEmptyDbMock = {
  id: string;
  title: string;
  description: string;
  location: {
    address: string;
    district: string;
    lat: number;
    lng: number;
  };
  mediaType: MediaCategory;
  size: string;
  priceMin: number;
  priceMax: number;
  images: string[];
  createdAt: string;
};

/** DB에 발행 매체가 없을 때 /api/explore 전용 — id는 UUID가 아님 */
export const EXPLORE_EMPTY_DB_MOCKS: ExploreEmptyDbMock[] = [
  {
    id: "mock-media-1",
    title: "MOCK 강남대로 디지털 보드",
    description: "강남역 사거리 인근 테스트용 디지털 보드 매체입니다.",
    location: {
      address: "서울 강남구 강남대로 390",
      district: "강남구",
      lat: 37.4979,
      lng: 127.0276,
    },
    mediaType: MediaCategory.DIGITAL_BOARD,
    size: "",
    priceMin: 3_000_000,
    priceMax: 5_000_000,
    images: ["https://picsum.photos/800/600?random=11"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-media-2",
    title: "MOCK 홍대입구 옥상 빌보드",
    description: "홍대 상권 데모용 고정식 빌보드입니다.",
    location: {
      address: "서울 마포구 양화로 160",
      district: "마포구",
      lat: 37.5563,
      lng: 126.9237,
    },
    mediaType: MediaCategory.BILLBOARD,
    size: "",
    priceMin: 8_000_000,
    priceMax: 12_000_000,
    images: ["https://picsum.photos/800/600?random=12"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-media-3",
    title: "MOCK 서울역 KTX 통로 디지털",
    description: "환승 동선 데모 — 교통 허브 타깃.",
    location: {
      address: "서울 용산구 청파로 378",
      district: "용산구",
      lat: 37.5547,
      lng: 126.9707,
    },
    mediaType: MediaCategory.DIGITAL_BOARD,
    size: "",
    priceMin: 15_000_000,
    priceMax: 22_000_000,
    images: ["https://picsum.photos/800/600?random=13"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-media-4",
    title: "MOCK 명동 중앙길 스트리트 퍼니처",
    description: "보행자 전용 구역 데모 매체.",
    location: {
      address: "서울 중구 명동8길",
      district: "중구",
      lat: 37.5636,
      lng: 126.9826,
    },
    mediaType: MediaCategory.STREET_FURNITURE,
    size: "",
    priceMin: 2_000_000,
    priceMax: 4_000_000,
    images: ["https://picsum.photos/800/600?random=14"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-media-5",
    title: "MOCK 잠실 롯데타워 인근 버스쉘터",
    description: "강동·송파권 트랜짓 패키지 데모.",
    location: {
      address: "서울 송파구 올림픽로 300",
      district: "송파구",
      lat: 37.5125,
      lng: 127.1025,
    },
    mediaType: MediaCategory.TRANSIT,
    size: "",
    priceMin: 1_200_000,
    priceMax: 2_800_000,
    images: ["https://picsum.photos/800/600?random=15"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-media-6",
    title: "MOCK 이태원 해밀톤호텔 외벽",
    description: "글로벌 관광객 동선 데모 월/외벽 매체.",
    location: {
      address: "서울 용산구 이태원로 179",
      district: "용산구",
      lat: 37.5347,
      lng: 126.9947,
    },
    mediaType: MediaCategory.WALL,
    size: "",
    priceMin: 18_000_000,
    priceMax: 28_000_000,
    images: ["https://picsum.photos/800/600?random=16"],
    createdAt: new Date().toISOString(),
  },
];

const MOCK_BY_ID = new Map(EXPLORE_EMPTY_DB_MOCKS.map((m) => [m.id, m]));

export function getExploreEmptyDbMock(id: string): ExploreEmptyDbMock | undefined {
  return MOCK_BY_ID.get(id);
}

/** Prisma `media` compare select와 동일한 형태 */
export function exploreMockToCompareMedia(m: ExploreEmptyDbMock) {
  return {
    id: m.id,
    mediaName: m.title,
    description: m.description,
    category: m.mediaType,
    price: Math.round((m.priceMin + m.priceMax) / 2),
    cpm: null as number | null,
    trustScore: 72 as number | null,
    locationJson: m.location,
    exposureJson: { daily_traffic: "(데모)" },
    images: m.images,
    pros: "데모용 목 데이터입니다." as string | null,
    cons: null as string | null,
    targetAudience: null as string | null,
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isMediaUuid(id: string): boolean {
  return UUID_RE.test(id.trim());
}
