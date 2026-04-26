/**
 * Asia media seed — 20 Korean + 5 Japanese realistic OOH inventory records
 * plus 6 additional dummy users (3 advertisers, 3 media owners) to give the
 * existing 10-record demo set more breadth across cities and roles.
 *
 * Idempotent: every record is upserted by a stable UUID (different namespace
 * from the existing `fade...` IDs in `seed.ts` — no collisions).
 *
 * Called from `prisma/seed.ts` after the original seed has run, so the four
 * primary test accounts (partner1/2, admin, advertiser) already exist and
 * can be reused as fallback owners if needed.
 *
 * Coordinates and addresses are real public locations. Prices and traffic
 * numbers are demo-realistic but not authoritative.
 */
import {
  CurrencyCode,
  MediaCategory,
  MediaStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";

// Stable UUIDs — `c001…` for new users, `b001…` (KR) and `b005…` (JP) for media.
const USER_IDS = {
  ownerBusan:    "c0010001-0001-4000-a000-000000000001",
  ownerJapan:    "c0010002-0002-4000-a000-000000000002",
  ownerJeju:     "c0010003-0003-4000-a000-000000000003",
  advertiserFashion: "c0020001-0001-4000-a000-000000000001",
  advertiserFnb:     "c0020002-0002-4000-a000-000000000002",
  advertiserGame:    "c0020003-0003-4000-a000-000000000003",
} as const;

type SeededUserIds = typeof USER_IDS;

async function seedAdditionalUsers(prisma: PrismaClient): Promise<SeededUserIds> {
  const users: Array<{
    id: string;
    clerkId: string;
    email: string;
    name: string;
    role: UserRole;
  }> = [
    { id: USER_IDS.ownerBusan,    clerkId: "test_owner_busan",    email: "owner.busan@xthex.test",    name: "해운대 미디어",        role: UserRole.MEDIA_OWNER },
    { id: USER_IDS.ownerJapan,    clerkId: "test_owner_japan",    email: "owner.japan@xthex.test",    name: "Tokyo OOH Partners",  role: UserRole.MEDIA_OWNER },
    { id: USER_IDS.ownerJeju,     clerkId: "test_owner_jeju",     email: "owner.jeju@xthex.test",     name: "제주 옥외광고",        role: UserRole.MEDIA_OWNER },
    { id: USER_IDS.advertiserFashion, clerkId: "test_adv_fashion", email: "adv.fashion@xthex.test", name: "VESTRA Fashion",   role: UserRole.ADVERTISER },
    { id: USER_IDS.advertiserFnb,     clerkId: "test_adv_fnb",     email: "adv.fnb@xthex.test",     name: "오븐베이커리",          role: UserRole.ADVERTISER },
    { id: USER_IDS.advertiserGame,    clerkId: "test_adv_game",    email: "adv.game@xthex.test",    name: "PixelForge Games", role: UserRole.ADVERTISER },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { clerkId: u.clerkId },
      create: {
        id: u.id,
        clerkId: u.clerkId,
        email: u.email,
        name: u.name,
        role: u.role,
        onboardingCompleted: true,
      },
      update: {
        email: u.email,
        name: u.name,
        role: u.role,
        onboardingCompleted: true,
      },
    });
  }
  console.log(`[seed:asia] users upserted: ${users.length}`);
  return USER_IDS;
}

// Media records and the main exported entry point follow in subsequent edits.
export { seedAdditionalUsers, USER_IDS };

// ─────────────────────────────────────────────────────────────────────────
// Media catalog — 20 KR + 5 JP. Stable UUIDs in the `b00…` namespace.
// ─────────────────────────────────────────────────────────────────────────

type MediaSeed = {
  id: string;
  mediaName: string;
  category: MediaCategory;
  description: string;
  locationJson: {
    address: string;
    district: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  /** Monthly price in the record's `currency`. */
  price: number;
  exposureJson: { daily_traffic: number; monthly_impressions?: number };
  targetAudience?: string;
  tags: string[];
  audienceTags: string[];
  trustScore: number;
  globalCountryCode: string;
  currency: CurrencyCode;
  /** Index into the partner-IDs array passed to `seedAsiaMediaCatalog`. */
  ownerSlot: "partner1" | "partner2" | "ownerBusan" | "ownerJapan" | "ownerJeju";
};

const KR_MEDIA: MediaSeed[] = [
  // ── Seoul (8) ─────────────────────────────────────────────────────────
  {
    id: "b0010001-0001-4000-a000-000000000001",
    mediaName: "명동 신세계백화점 미디어월",
    category: MediaCategory.DIGITAL_BOARD,
    description: "본점 외벽 미디어 파사드. 외국인 관광객 비중 65%, 야간 21시까지 송출. 31m × 14m, 4K HDR.",
    locationJson: { address: "서울 중구 소공로 63 신세계백화점 본점", district: "중구", city: "Seoul", country: "KR", lat: 37.5613, lng: 126.9817 },
    price: 35_000_000,
    exposureJson: { daily_traffic: 280_000, monthly_impressions: 8_400_000 },
    targetAudience: "20-50",
    tags: ["media-facade", "myeongdong", "shinsegae", "tourist", "4K-HDR"],
    audienceTags: ["외국인 관광객", "20-50대", "쇼핑객", "프리미엄"],
    trustScore: 94,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner1",
  },
  {
    id: "b0010002-0002-4000-a000-000000000002",
    mediaName: "홍대입구역 9번출구 빌보드",
    category: MediaCategory.BILLBOARD,
    description: "홍대 메인 게이트. 주말 시간당 최대 4만 명 통행, 24시간 점등 LED.",
    locationJson: { address: "서울 마포구 양화로 지하 188", district: "마포구", city: "Seoul", country: "KR", lat: 37.5572, lng: 126.9243 },
    price: 18_000_000,
    exposureJson: { daily_traffic: 220_000, monthly_impressions: 6_600_000 },
    targetAudience: "18-30",
    tags: ["billboard", "hongdae", "exit-9", "nightlife"],
    audienceTags: ["MZ세대", "대학생", "외국인", "야간"],
    trustScore: 89,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner2",
  },
  {
    id: "b0010003-0003-4000-a000-000000000003",
    mediaName: "롯데월드타워 미디어파사드",
    category: MediaCategory.WALL,
    description: "555m 초고층 빌딩 미디어 파사드. 잠실 일대 광역 가시성, 한강 건너편에서도 노출.",
    locationJson: { address: "서울 송파구 올림픽로 300", district: "송파구", city: "Seoul", country: "KR", lat: 37.5125, lng: 127.1025 },
    price: 80_000_000,
    exposureJson: { daily_traffic: 600_000, monthly_impressions: 18_000_000 },
    targetAudience: "20-60",
    tags: ["media-facade", "skyscraper", "jamsil", "landmark"],
    audienceTags: ["전 연령", "관광객", "프리미엄", "야간"],
    trustScore: 97,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner1",
  },
  {
    id: "b0010004-0004-4000-a000-000000000004",
    mediaName: "광화문 D타워 디지털 빌보드",
    category: MediaCategory.DIGITAL_BOARD,
    description: "광화문 사거리. 종로구청·시청 직장인 + 광화문광장 관광객 동시 노출.",
    locationJson: { address: "서울 종로구 종로 6 D타워", district: "종로구", city: "Seoul", country: "KR", lat: 37.5710, lng: 126.9784 },
    price: 22_000_000,
    exposureJson: { daily_traffic: 180_000, monthly_impressions: 5_400_000 },
    targetAudience: "30-55",
    tags: ["digital-board", "gwanghwamun", "office", "tourist"],
    audienceTags: ["직장인", "30-50대", "관광객"],
    trustScore: 88,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner1",
  },
  {
    id: "b0010005-0005-4000-a000-000000000005",
    mediaName: "이태원 해밀톤호텔 LED",
    category: MediaCategory.DIGITAL_BOARD,
    description: "이태원역 1번 출구 정면. 외국인 거주민·관광객 비중 높음.",
    locationJson: { address: "서울 용산구 이태원로 179", district: "용산구", city: "Seoul", country: "KR", lat: 37.5345, lng: 126.9947 },
    price: 12_000_000,
    exposureJson: { daily_traffic: 95_000, monthly_impressions: 2_850_000 },
    targetAudience: "20-40",
    tags: ["led", "itaewon", "expat", "nightlife"],
    audienceTags: ["외국인", "MZ세대", "야간 활동층"],
    trustScore: 84,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner2",
  },
  {
    id: "b0010006-0006-4000-a000-000000000006",
    mediaName: "여의도 IFC몰 미디어월",
    category: MediaCategory.DIGITAL_BOARD,
    description: "IFC몰 지하 1층 메인 광장. 점심·퇴근 시간 금융권 직장인 집중.",
    locationJson: { address: "서울 영등포구 국제금융로 10", district: "영등포구", city: "Seoul", country: "KR", lat: 37.5252, lng: 126.9255 },
    price: 16_000_000,
    exposureJson: { daily_traffic: 120_000, monthly_impressions: 3_600_000 },
    targetAudience: "25-50",
    tags: ["mall-screen", "yeouido", "ifc", "finance"],
    audienceTags: ["직장인", "금융권", "프리미엄"],
    trustScore: 90,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner1",
  },
  {
    id: "b0010007-0007-4000-a000-000000000007",
    mediaName: "영등포역 3번출구 빌보드",
    category: MediaCategory.BILLBOARD,
    description: "영등포 타임스퀘어 인근. 환승 트래픽 + 쇼핑객.",
    locationJson: { address: "서울 영등포구 영등포로 지하 274", district: "영등포구", city: "Seoul", country: "KR", lat: 37.5154, lng: 126.9075 },
    price: 9_500_000,
    exposureJson: { daily_traffic: 150_000, monthly_impressions: 4_500_000 },
    targetAudience: "20-50",
    tags: ["billboard", "yeongdeungpo", "transit", "mall"],
    audienceTags: ["쇼핑객", "환승객", "20-50대"],
    trustScore: 81,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner2",
  },
  {
    id: "b0010008-0008-4000-a000-000000000008",
    mediaName: "압구정 갤러리아 미디어 파사드",
    category: MediaCategory.STREET_FURNITURE,
    description: "갤러리아백화점 명품관 외벽. 럭셔리·뷰티 브랜드 집행 비중 70%.",
    locationJson: { address: "서울 강남구 압구정로 343", district: "강남구", city: "Seoul", country: "KR", lat: 37.5274, lng: 127.0397 },
    price: 28_000_000,
    exposureJson: { daily_traffic: 75_000, monthly_impressions: 2_250_000 },
    targetAudience: "30-55",
    tags: ["luxury", "apgujeong", "galleria", "fashion"],
    audienceTags: ["럭셔리", "30-50대", "여성", "프리미엄"],
    trustScore: 93,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner1",
  },
  // ── Incheon (2) ──────────────────────────────────────────────────────
  {
    id: "b0010009-0009-4000-a000-000000000009",
    mediaName: "인천공항 제2터미널 출국장 디지털",
    category: MediaCategory.TRANSIT,
    description: "T2 출국 게이트 12-25번 메인 디스플레이. 일 평균 출국 14만 명 노출.",
    locationJson: { address: "인천 중구 공항로 272 제2여객터미널", district: "중구", city: "Incheon", country: "KR", lat: 37.4602, lng: 126.4407 },
    price: 45_000_000,
    exposureJson: { daily_traffic: 140_000, monthly_impressions: 4_200_000 },
    targetAudience: "25-55",
    tags: ["airport", "incheon-t2", "departure", "premium"],
    audienceTags: ["출국 여행객", "비즈니스", "프리미엄", "외국인"],
    trustScore: 96,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner1",
  },
  {
    id: "b001000a-000a-4000-a000-00000000000a",
    mediaName: "송도 센트럴파크 옥외 LED",
    category: MediaCategory.DIGITAL_BOARD,
    description: "센트럴파크 동측 입구. 송도 국제업무지구 IT/바이오 직장인 + 주말 가족 단위.",
    locationJson: { address: "인천 연수구 컨벤시아대로 160", district: "연수구", city: "Incheon", country: "KR", lat: 37.3925, lng: 126.6411 },
    price: 7_500_000,
    exposureJson: { daily_traffic: 60_000, monthly_impressions: 1_800_000 },
    targetAudience: "25-45",
    tags: ["led", "songdo", "central-park", "ibd"],
    audienceTags: ["직장인", "IT/바이오", "가족"],
    trustScore: 79,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner2",
  },
  // ── Busan (4) ────────────────────────────────────────────────────────
  {
    id: "b001000b-000b-4000-a000-00000000000b",
    mediaName: "해운대 마린시티 빌보드",
    category: MediaCategory.BILLBOARD,
    description: "해운대 더베이 101 정면. 해변·요트경기장·고급 주거 지역 통합 노출.",
    locationJson: { address: "부산 해운대구 마린시티1로 38", district: "해운대구", city: "Busan", country: "KR", lat: 35.1581, lng: 129.1438 },
    price: 11_000_000,
    exposureJson: { daily_traffic: 85_000, monthly_impressions: 2_550_000 },
    targetAudience: "25-50",
    tags: ["billboard", "haeundae", "marine-city", "coastal"],
    audienceTags: ["관광객", "프리미엄", "해변"],
    trustScore: 87,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "ownerBusan",
  },
  {
    id: "b001000c-000c-4000-a000-00000000000c",
    mediaName: "광안리 광안대교 LED 비치사이드",
    category: MediaCategory.DIGITAL_BOARD,
    description: "광안리 해수욕장 정면 광안대교 야경 동시 노출. 부산불꽃축제 시즌 광역 도달.",
    locationJson: { address: "부산 수영구 광안해변로 219", district: "수영구", city: "Busan", country: "KR", lat: 35.1532, lng: 129.1187 },
    price: 9_000_000,
    exposureJson: { daily_traffic: 110_000, monthly_impressions: 3_300_000 },
    targetAudience: "20-50",
    tags: ["led", "gwangalli", "beach", "night-view"],
    audienceTags: ["관광객", "야간", "해변"],
    trustScore: 85,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "ownerBusan",
  },
  {
    id: "b001000d-000d-4000-a000-00000000000d",
    mediaName: "서면 롯데호텔 미디어파사드",
    category: MediaCategory.WALL,
    description: "부산 핵심 상권 서면 교차로. 롯데호텔 외벽 32층 규모 미디어 파사드.",
    locationJson: { address: "부산 부산진구 가야대로 772", district: "부산진구", city: "Busan", country: "KR", lat: 35.1576, lng: 129.0594 },
    price: 13_500_000,
    exposureJson: { daily_traffic: 165_000, monthly_impressions: 4_950_000 },
    targetAudience: "20-50",
    tags: ["media-facade", "seomyeon", "lotte", "downtown"],
    audienceTags: ["쇼핑객", "직장인", "야간"],
    trustScore: 86,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "ownerBusan",
  },
  {
    id: "b001000e-000e-4000-a000-00000000000e",
    mediaName: "부산역 광장 디지털 빌보드",
    category: MediaCategory.TRANSIT,
    description: "부산역 KTX·SRT 출구 정면. 일 평균 환승 18만 명.",
    locationJson: { address: "부산 동구 중앙대로 206", district: "동구", city: "Busan", country: "KR", lat: 35.1156, lng: 129.0413 },
    price: 8_000_000,
    exposureJson: { daily_traffic: 180_000, monthly_impressions: 5_400_000 },
    targetAudience: "20-60",
    tags: ["transit", "busan-station", "ktx"],
    audienceTags: ["환승객", "비즈니스", "관광객"],
    trustScore: 83,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "ownerBusan",
  },
  // ── Daegu (2) ────────────────────────────────────────────────────────
  {
    id: "b001000f-000f-4000-a000-00000000000f",
    mediaName: "동성로 메가타운 LED",
    category: MediaCategory.DIGITAL_BOARD,
    description: "대구 핵심 쇼핑 상권 동성로. 10·20대 보행자 집중.",
    locationJson: { address: "대구 중구 동성로2길 81", district: "중구", city: "Daegu", country: "KR", lat: 35.8693, lng: 128.5953 },
    price: 5_500_000,
    exposureJson: { daily_traffic: 90_000, monthly_impressions: 2_700_000 },
    targetAudience: "10-30",
    tags: ["led", "dongseongno", "shopping", "youth"],
    audienceTags: ["10-30대", "쇼핑객", "MZ세대"],
    trustScore: 80,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner2",
  },
  {
    id: "b0010010-0010-4000-a000-000000000010",
    mediaName: "대구 반월당역 디지털 빌보드",
    category: MediaCategory.TRANSIT,
    description: "대구 1·2호선 환승역. 도심 환승 트래픽 집중.",
    locationJson: { address: "대구 중구 달구벌대로 지하 2100", district: "중구", city: "Daegu", country: "KR", lat: 35.8654, lng: 128.5933 },
    price: 4_200_000,
    exposureJson: { daily_traffic: 70_000, monthly_impressions: 2_100_000 },
    targetAudience: "20-50",
    tags: ["transit", "banwoldang", "subway"],
    audienceTags: ["환승객", "직장인", "20-50대"],
    trustScore: 76,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner2",
  },
  // ── Daejeon (1) ──────────────────────────────────────────────────────
  {
    id: "b0010011-0011-4000-a000-000000000011",
    mediaName: "둔산동 시청앞 빌보드",
    category: MediaCategory.BILLBOARD,
    description: "대전 행정·금융 중심 둔산동. 시청·정부청사 직장인 트래픽.",
    locationJson: { address: "대전 서구 둔산로 100", district: "서구", city: "Daejeon", country: "KR", lat: 36.3504, lng: 127.3845 },
    price: 3_800_000,
    exposureJson: { daily_traffic: 65_000, monthly_impressions: 1_950_000 },
    targetAudience: "30-55",
    tags: ["billboard", "dunsan", "city-hall", "office"],
    audienceTags: ["직장인", "공무원", "30-50대"],
    trustScore: 75,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner2",
  },
  // ── Gwangju (1) ──────────────────────────────────────────────────────
  {
    id: "b0010012-0012-4000-a000-000000000012",
    mediaName: "광주 충장로 LED",
    category: MediaCategory.DIGITAL_BOARD,
    description: "광주 핵심 쇼핑 거리. 호남권 광역 도달.",
    locationJson: { address: "광주 동구 충장로 80", district: "동구", city: "Gwangju", country: "KR", lat: 35.1466, lng: 126.9156 },
    price: 3_200_000,
    exposureJson: { daily_traffic: 55_000, monthly_impressions: 1_650_000 },
    targetAudience: "20-50",
    tags: ["led", "chungjangno", "shopping", "honam"],
    audienceTags: ["쇼핑객", "MZ세대", "지역민"],
    trustScore: 74,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "partner2",
  },
  // ── Jeju (2) ─────────────────────────────────────────────────────────
  {
    id: "b0010013-0013-4000-a000-000000000013",
    mediaName: "제주공항 출발층 디지털",
    category: MediaCategory.TRANSIT,
    description: "제주국제공항 출발 게이트 메인 디스플레이. 관광객·항공 환승객.",
    locationJson: { address: "제주 제주시 공항로 2", district: "제주시", city: "Jeju", country: "KR", lat: 33.5113, lng: 126.4930 },
    price: 6_500_000,
    exposureJson: { daily_traffic: 95_000, monthly_impressions: 2_850_000 },
    targetAudience: "20-60",
    tags: ["airport", "jeju", "departure", "tourism"],
    audienceTags: ["관광객", "여행객", "가족"],
    trustScore: 88,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "ownerJeju",
  },
  {
    id: "b0010014-0014-4000-a000-000000000014",
    mediaName: "서귀포 중문관광단지 빌보드",
    category: MediaCategory.BILLBOARD,
    description: "중문 리조트단지 진입로. 신라호텔·롯데호텔 인근.",
    locationJson: { address: "제주 서귀포시 중문관광로 72번길", district: "서귀포시", city: "Jeju", country: "KR", lat: 33.2452, lng: 126.4084 },
    price: 2_800_000,
    exposureJson: { daily_traffic: 35_000, monthly_impressions: 1_050_000 },
    targetAudience: "25-55",
    tags: ["billboard", "jungmun", "resort", "tourism"],
    audienceTags: ["관광객", "리조트 투숙객", "가족"],
    trustScore: 78,
    globalCountryCode: "KR", currency: CurrencyCode.KRW,
    ownerSlot: "ownerJeju",
  },
];

const JP_MEDIA: MediaSeed[] = [
  {
    id: "b0050001-0001-4000-a000-000000000001",
    mediaName: "渋谷スクランブル交差点 Q-FRONT ビジョン",
    category: MediaCategory.DIGITAL_BOARD,
    description: "Shibuya Scramble Crossing Q-FRONT vision. 일 평균 250만 명 통과, 세계에서 가장 분주한 교차로 정면.",
    locationJson: { address: "東京都渋谷区宇田川町21-6 QFRONT", district: "渋谷区", city: "Tokyo", country: "JP", lat: 35.6595, lng: 139.7005 },
    price: 8_000_000, // JPY / month
    exposureJson: { daily_traffic: 2_500_000, monthly_impressions: 75_000_000 },
    targetAudience: "15-45",
    tags: ["scramble-crossing", "shibuya", "landmark", "tourist", "qfront"],
    audienceTags: ["観光客", "MZ世代", "外国人", "若者"],
    trustScore: 99,
    globalCountryCode: "JP", currency: CurrencyCode.JPY,
    ownerSlot: "ownerJapan",
  },
  {
    id: "b0050002-0002-4000-a000-000000000002",
    mediaName: "新宿アルタビジョン",
    category: MediaCategory.BILLBOARD,
    description: "新宿駅東口 Studio Alta 大型ビジョン. 신주쿠역 동쪽 출구 정면, 점심 시간대 30대 직장인 + 야간 유흥객.",
    locationJson: { address: "東京都新宿区新宿3-24-3", district: "新宿区", city: "Tokyo", country: "JP", lat: 35.6912, lng: 139.7036 },
    price: 5_500_000,
    exposureJson: { daily_traffic: 1_400_000, monthly_impressions: 42_000_000 },
    targetAudience: "20-50",
    tags: ["billboard", "shinjuku", "alta", "station-front"],
    audienceTags: ["会社員", "若者", "夜間"],
    trustScore: 95,
    globalCountryCode: "JP", currency: CurrencyCode.JPY,
    ownerSlot: "ownerJapan",
  },
  {
    id: "b0050003-0003-4000-a000-000000000003",
    mediaName: "東京駅丸の内 KITTE ビルボード",
    category: MediaCategory.WALL,
    description: "도쿄역 마루노우치 출구 정면 KITTE 빌딩. 신칸센 환승객 + 마루노우치 비즈니스 디스트릭트.",
    locationJson: { address: "東京都千代田区丸の内2-7-2 KITTE", district: "千代田区", city: "Tokyo", country: "JP", lat: 35.6797, lng: 139.7644 },
    price: 9_500_000,
    exposureJson: { daily_traffic: 850_000, monthly_impressions: 25_500_000 },
    targetAudience: "30-60",
    tags: ["wall", "marunouchi", "tokyo-station", "business", "shinkansen"],
    audienceTags: ["ビジネス", "30-60代", "出張", "外国人"],
    trustScore: 96,
    globalCountryCode: "JP", currency: CurrencyCode.JPY,
    ownerSlot: "ownerJapan",
  },
  {
    id: "b0050004-0004-4000-a000-000000000004",
    mediaName: "道頓堀 グリコサイン隣接 LED",
    category: MediaCategory.DIGITAL_BOARD,
    description: "오사카 도톤보리 글리코사인 옆 대형 LED. 관광객 100% 노출 보장 핵심 동선.",
    locationJson: { address: "大阪府大阪市中央区道頓堀1-10-2", district: "中央区", city: "Osaka", country: "JP", lat: 34.6687, lng: 135.5008 },
    price: 4_800_000,
    exposureJson: { daily_traffic: 600_000, monthly_impressions: 18_000_000 },
    targetAudience: "15-50",
    tags: ["led", "dotonbori", "glico", "osaka", "landmark"],
    audienceTags: ["観光客", "外国人", "若者", "夜間"],
    trustScore: 94,
    globalCountryCode: "JP", currency: CurrencyCode.JPY,
    ownerSlot: "ownerJapan",
  },
  {
    id: "b0050005-0005-4000-a000-000000000005",
    mediaName: "秋葉原 ラジオ会館 ビルボード",
    category: MediaCategory.BILLBOARD,
    description: "秋葉原駅電気街口 ラジオ会館 옥상 빌보드. 애니메이션·게임·IT 관련 광고 집행 비중 80%.",
    locationJson: { address: "東京都千代田区外神田1-15-16", district: "千代田区", city: "Tokyo", country: "JP", lat: 35.6987, lng: 139.7714 },
    price: 2_200_000,
    exposureJson: { daily_traffic: 320_000, monthly_impressions: 9_600_000 },
    targetAudience: "15-40",
    tags: ["billboard", "akihabara", "radio-kaikan", "anime", "gaming"],
    audienceTags: ["オタク", "若者", "外国人", "ゲーム"],
    trustScore: 90,
    globalCountryCode: "JP", currency: CurrencyCode.JPY,
    ownerSlot: "ownerJapan",
  },
];

/**
 * Resolve owner slot → actual user ID. Falls back to passed primary owner
 * IDs for the partner1/partner2 slots that came from the original seed.
 */
type OwnerLookup = {
  partner1: string;
  partner2: string;
  ownerBusan: string;
  ownerJapan: string;
  ownerJeju: string;
};

async function seedAsiaMediaCatalog(
  prisma: PrismaClient,
  owners: OwnerLookup,
): Promise<void> {
  const all = [...KR_MEDIA, ...JP_MEDIA];
  for (const m of all) {
    const ownerId = owners[m.ownerSlot];
    const data = {
      id: m.id,
      mediaName: m.mediaName,
      category: m.category,
      description: m.description,
      locationJson: m.locationJson,
      price: m.price,
      exposureJson: m.exposureJson,
      targetAudience: m.targetAudience ?? null,
      images: [] as string[],
      sampleImages: [] as string[],
      tags: m.tags,
      audienceTags: m.audienceTags,
      trustScore: m.trustScore,
      status: MediaStatus.PUBLISHED,
      globalCountryCode: m.globalCountryCode,
      currency: m.currency,
      createdById: ownerId,
    };
    await prisma.media.upsert({
      where: { id: m.id },
      create: data,
      update: {
        mediaName: data.mediaName,
        category: data.category,
        description: data.description,
        locationJson: data.locationJson,
        price: data.price,
        exposureJson: data.exposureJson,
        targetAudience: data.targetAudience,
        tags: data.tags,
        audienceTags: data.audienceTags,
        trustScore: data.trustScore,
        status: data.status,
        globalCountryCode: data.globalCountryCode,
        currency: data.currency,
        createdById: data.createdById,
      },
    });
  }
  console.log(
    `[seed:asia] media upserted: ${KR_MEDIA.length} KR + ${JP_MEDIA.length} JP = ${all.length}`,
  );
}

export { seedAsiaMediaCatalog };
export type { OwnerLookup };
