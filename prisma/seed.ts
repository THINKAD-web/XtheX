import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), ".env.local"), override: true });
config(); // fallback to .env for non-overridden vars
import bcrypt from "bcrypt";
import {
  CurrencyCode,
  MediaCategory,
  MediaStatus,
  MediaType,
  PrismaClient,
  ProposalStatus,
  UserRole,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/** NextAuth credentials 로그인용 — 테스트 계정 비밀번호 보강 */
const SEED_TEST_PASSWORD_PLAIN = "password123";
const BCRYPT_ROUNDS = 12;

/** 아래 upsert와 동일한 시드 이메일 (clerkId 없어도 매칭 가능) */
const SEED_USER_EMAILS = [
  "partner1@xthex.test",
  "partner2@xthex.test",
  "admin@xthex.test",
  "advertiser@xthex.test",
] as const;

/**
 * `password`가 null인 사용자 중
 * - `clerkId`가 있거나
 * - 시드에서 쓰는 이메일인 경우
 * → bcrypt 해시(`password123`) 설정.
 */
async function ensureHashedPasswordsForClerkUsers(prisma: PrismaClient) {
  const users = await prisma.user.findMany({
    where: {
      password: null,
      OR: [
        { clerkId: { not: null } },
        { email: { in: [...SEED_USER_EMAILS] } },
      ],
    },
    select: { id: true, email: true, clerkId: true },
  });
  if (users.length === 0) return;

  const hashed = await bcrypt.hash(SEED_TEST_PASSWORD_PLAIN, BCRYPT_ROUNDS);
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: { password: hashed },
    });
    console.log(
      `[seed] credentials 비밀번호 설정: ${u.email} (clerkId=${u.clerkId ?? "null"}) → "${SEED_TEST_PASSWORD_PLAIN}"`,
    );
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DATABASE_URL");

const pool = new Pool({ connectionString, max: 1 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const IDS = {
  users: {
    partner1: "11111111-1111-1111-1111-111111111111",
    partner2: "22222222-2222-2222-2222-222222222222",
    admin: "33333333-3333-3333-3333-333333333333",
    advertiser: "44444444-4444-4444-4444-444444444444",
  },
  proposals: {
    seoulBillboard: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    gangnamDigital: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    busShelter: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    incheonAirport: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    tokyoSample: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  },
  media: {
    coexKpopSquare:   "fade0001-0001-4000-a000-000000000001",
    gangnamGlight:    "fade0002-0002-4000-a000-000000000002",
    sinnonhyeonDsg:   "fade0003-0003-4000-a000-000000000003",
    cheongdamSsTower: "fade0004-0004-4000-a000-000000000004",
    seongsuBando:     "fade0005-0005-4000-a000-000000000005",
    seongsuStation:   "fade0006-0006-4000-a000-000000000006",
    timesSquare:      "fade0007-0007-4000-a000-000000000007",
    burjKhalifa:      "fade0008-0008-4000-a000-000000000008",
    tokyoAdTruck:     "fade0009-0009-4000-a000-000000000009",
    londonPiccadilly: "fade000a-000a-4000-a000-00000000000a",
  },
};

async function main() {
  // Idempotent seed: upsert by stable IDs / unique clerkId.
  const partner1 = await prisma.user.upsert({
    where: { clerkId: "test_partner1" },
    create: {
      id: IDS.users.partner1,
      clerkId: "test_partner1",
      role: UserRole.MEDIA_OWNER,
      onboardingCompleted: true,
      email: "partner1@xthex.test",
      name: "Test Partner 1",
    },
    update: {
      role: UserRole.MEDIA_OWNER,
      onboardingCompleted: true,
      email: "partner1@xthex.test",
      name: "Test Partner 1",
    },
  });
  const partner2 = await prisma.user.upsert({
    where: { clerkId: "test_partner2" },
    create: {
      id: IDS.users.partner2,
      clerkId: "test_partner2",
      role: UserRole.MEDIA_OWNER,
      onboardingCompleted: true,
      email: "partner2@xthex.test",
      name: "Test Partner 2",
    },
    update: {
      role: UserRole.MEDIA_OWNER,
      onboardingCompleted: true,
      email: "partner2@xthex.test",
      name: "Test Partner 2",
    },
  });
  const admin = await prisma.user.upsert({
    where: { clerkId: "test_admin" },
    create: {
      id: IDS.users.admin,
      clerkId: "test_admin",
      role: UserRole.ADMIN,
      onboardingCompleted: true,
      email: "admin@xthex.test",
      name: "Test Admin",
    },
    update: {
      role: UserRole.ADMIN,
      onboardingCompleted: true,
      email: "admin@xthex.test",
      name: "Test Admin",
    },
  });

  const advertiser = await prisma.user.upsert({
    where: { clerkId: "test_advertiser" },
    create: {
      id: IDS.users.advertiser,
      clerkId: "test_advertiser",
      role: UserRole.ADVERTISER,
      onboardingCompleted: true,
      email: "advertiser@xthex.test",
      name: "Test Advertiser",
    },
    update: {
      role: UserRole.ADVERTISER,
      onboardingCompleted: true,
      email: "advertiser@xthex.test",
      name: "Test Advertiser",
    },
  });

  // ── Media 실제 매체 10개 (한국 6 + 해외 4) ──────────────
  const mediaInputs = [
    // ── Korea (6) ──────────────────────────────────
    {
      id: IDS.media.coexKpopSquare,
      mediaName: "COEX K-POP Square",
      category: MediaCategory.DIGITAL_BOARD,
      description: "국내 최대 커브드 LED, 애너모픽 3D 착시 영상 가능. 80.9m×20.1m (1,620㎡), 해상도 7840×1952.",
      locationJson: { address: "서울 강남구 영동대로 513 코엑스", district: "강남구", city: "Seoul", country: "KR", lat: 37.5112, lng: 127.0595 },
      price: 50_000_000,
      exposureJson: { daily_traffic: 450000, monthly_impressions: 15000000 },
      targetAudience: "20-40",
      images: [] as string[],
      sampleImages: [] as string[],
      tags: ["kpop", "coex", "landmark", "curved-led"],
      audienceTags: ["20-40대", "관광객", "쇼핑객"],
      trustScore: 96, status: MediaStatus.PUBLISHED,
      globalCountryCode: "KR", currency: CurrencyCode.KRW,
      createdById: partner1.id,
    },
    {
      id: IDS.media.gangnamGlight,
      mediaName: "Gangnam-daero G-LIGHT Mediapole",
      category: MediaCategory.STREET_FURNITURE,
      description: "18기 동시 송출, 성별 인식 맞춤 광고. 강남역-신논현역 760m 구간, 1.5m×5.34m×18기.",
      locationJson: { address: "강남역-신논현역 760m 구간", district: "강남구", city: "Seoul", country: "KR", lat: 37.4979, lng: 127.0276 },
      price: 40_000_000,
      exposureJson: { daily_traffic: 300000, monthly_impressions: 9000000 },
      targetAudience: "20-35",
      images: [] as string[],
      sampleImages: [] as string[],
      tags: ["mediapole", "gangnam", "gender-recognition", "smart-ad"],
      audienceTags: ["20-35대", "직장인", "쇼핑객"],
      trustScore: 90, status: MediaStatus.PUBLISHED,
      globalCountryCode: "KR", currency: CurrencyCode.KRW,
      createdById: partner1.id,
    },
    {
      id: IDS.media.sinnonhyeonDsg,
      mediaName: "Sinnonhyeon DSG Building Billboard",
      category: MediaCategory.DIGITAL_BOARD,
      description: "신논현역 DSG빌딩 디지털 빌보드. 강남대로 핵심 유동인구 밀집 지역.",
      locationJson: { address: "서울 강남구 신논현역 인근", district: "강남구", city: "Seoul", country: "KR", lat: 37.5044, lng: 127.0254 },
      exposureJson: { daily_traffic: 250000 },
      images: [] as string[],
      sampleImages: [] as string[],
      tags: ["billboard", "sinnonhyeon", "gangnam", "digital"],
      audienceTags: ["직장인", "20-40대"],
      trustScore: 85, status: MediaStatus.PUBLISHED,
      globalCountryCode: "KR", currency: CurrencyCode.KRW,
      createdById: partner1.id,
    },
    {
      id: IDS.media.cheongdamSsTower,
      mediaName: "Cheongdam Hakdong SS Tower Billboard",
      category: MediaCategory.DIGITAL_BOARD,
      description: "국내 최장 가시거리. 청담동 학동사거리 SS타워 디지털 빌보드.",
      locationJson: { address: "서울 강남구 청담동 학동사거리", district: "강남구", city: "Seoul", country: "KR", lat: 37.5169, lng: 127.0397 },
      exposureJson: {},
      images: [] as string[],
      sampleImages: [] as string[],
      tags: ["billboard", "cheongdam", "hakdong", "long-visibility"],
      audienceTags: ["프리미엄", "패션", "30-50대"],
      trustScore: 88, status: MediaStatus.PUBLISHED,
      globalCountryCode: "KR", currency: CurrencyCode.KRW,
      createdById: partner2.id,
    },
    {
      id: IDS.media.seongsuBando,
      mediaName: "Seongsu Bando Wall",
      category: MediaCategory.WALL,
      description: "성수동 반도 외벽 대형 광고. MZ세대 핫플레이스 성수동 핵심 위치.",
      locationJson: { address: "서울 성동구 성수동", district: "성동구", city: "Seoul", country: "KR", lat: 37.5445, lng: 127.0560 },
      targetAudience: "20-35",
      exposureJson: {},
      images: [] as string[],
      sampleImages: [] as string[],
      tags: ["wall", "seongsu", "outdoor", "large-format"],
      audienceTags: ["MZ세대", "20-35대", "트렌드"],
      trustScore: 82, status: MediaStatus.PUBLISHED,
      globalCountryCode: "KR", currency: CurrencyCode.KRW,
      createdById: partner2.id,
    },
    {
      id: IDS.media.seongsuStation,
      mediaName: "Seongsu Station Digital",
      category: MediaCategory.TRANSIT,
      description: "성수역 디지털 교통 광고. 성수동 유동인구 타겟.",
      locationJson: { address: "서울 성동구 성수역", district: "성동구", city: "Seoul", country: "KR", lat: 37.5445, lng: 127.0559 },
      exposureJson: { daily_traffic: 100000 },
      images: [] as string[],
      sampleImages: [] as string[],
      tags: ["transit", "seongsu", "digital", "station"],
      audienceTags: ["MZ세대", "직장인"],
      trustScore: 80, status: MediaStatus.PUBLISHED,
      globalCountryCode: "KR", currency: CurrencyCode.KRW,
      createdById: partner2.id,
    },
    // ── Overseas (4) ──────────────────────────────
    {
      id: IDS.media.timesSquare,
      mediaName: "Times Square Billboard",
      category: MediaCategory.BILLBOARD,
      description: "세계적 랜드마크. 뉴욕 타임스퀘어 대형 디지털 빌보드.",
      locationJson: { address: "Times Square, Manhattan, NY", district: "Manhattan", city: "New York", country: "US", lat: 40.7580, lng: -73.9855 },
      exposureJson: { daily_traffic: 330000 },
      images: [] as string[],
      sampleImages: [] as string[],
      tags: ["billboard", "times-square", "landmark", "LED"],
      audienceTags: ["tourists", "all-ages", "global"],
      trustScore: 98, status: MediaStatus.PUBLISHED,
      globalCountryCode: "US", currency: CurrencyCode.USD,
      createdById: partner1.id,
    },
    {
      id: IDS.media.burjKhalifa,
      mediaName: "Burj Khalifa LED",
      category: MediaCategory.WALL,
      description: "두바이 부르즈 할리파 빌딩 LED. 828m 초고층 건물 외벽 조명 광고.",
      locationJson: { address: "Burj Khalifa, Downtown Dubai", district: "Downtown Dubai", city: "Dubai", country: "AE", lat: 25.1972, lng: 55.2744 },
      exposureJson: {},
      images: [] as string[],
      sampleImages: [] as string[],
      tags: ["building-led", "burj-khalifa", "landmark", "luxury"],
      audienceTags: ["luxury", "tourists", "global"],
      trustScore: 97, status: MediaStatus.PUBLISHED,
      globalCountryCode: "AE", currency: CurrencyCode.USD,
      createdById: partner1.id,
    },
    {
      id: IDS.media.tokyoAdTruck,
      mediaName: "Tokyo Ad Truck",
      category: MediaCategory.ETC,
      description: "일본 도쿄 시내 이동형 애드트럭 광고.",
      locationJson: { address: "Tokyo, Japan", district: "Shibuya", city: "Tokyo", country: "JP", lat: 35.6762, lng: 139.6503 },
      exposureJson: {},
      images: [] as string[],
      sampleImages: [] as string[],
      tags: ["mobile", "truck", "tokyo", "moving-ad"],
      audienceTags: ["youth", "pedestrians", "all-ages"],
      trustScore: 78, status: MediaStatus.PUBLISHED,
      globalCountryCode: "JP", currency: CurrencyCode.JPY,
      createdById: partner2.id,
    },
    {
      id: IDS.media.londonPiccadilly,
      mediaName: "Piccadilly Circus Billboard",
      category: MediaCategory.BILLBOARD,
      description: "런던 피카딜리 서커스 대형 디지털 빌보드. 세계적 랜드마크.",
      locationJson: { address: "Piccadilly Circus, London", district: "Westminster", city: "London", country: "GB", lat: 51.5099, lng: -0.1342 },
      exposureJson: {},
      images: [] as string[],
      sampleImages: [] as string[],
      tags: ["billboard", "piccadilly", "landmark", "LED"],
      audienceTags: ["tourists", "all-ages", "global"],
      trustScore: 95, status: MediaStatus.PUBLISHED,
      globalCountryCode: "GB", currency: CurrencyCode.USD,
      createdById: partner1.id,
    },
  ];

  for (const m of mediaInputs) {
    await prisma.media.upsert({
      where: { id: m.id },
      create: m,
      update: {
        mediaName: m.mediaName,
        category: m.category,
        description: m.description,
        locationJson: m.locationJson,
        price: (m as any).price ?? null,
        cpm: (m as any).cpm ?? null,
        exposureJson: m.exposureJson,
        targetAudience: (m as any).targetAudience ?? null,
        images: m.images,
        sampleImages: m.sampleImages,
        tags: m.tags,
        audienceTags: m.audienceTags,
        trustScore: m.trustScore,
        status: m.status,
        globalCountryCode: m.globalCountryCode,
        currency: m.currency,
        createdById: m.createdById,
      },
    });
  }
  console.log(`[seed] Media 매체 ${mediaInputs.length}개 (5개국) upsert 완료`);

  const proposalInputs: Array<{
    id: string;
    userId: string;
    title: string;
    description: string;
    location: { lat: number; lng: number; address: string };
    mediaType: MediaType;
    size: string;
    priceMin: number;
    priceMax: number;
    images: string[];
    status: ProposalStatus;
  }> = [
    {
      id: IDS.proposals.seoulBillboard,
      userId: partner1.id,
      title: "Seoul City Center Billboard",
      description: "Premium billboard in central Seoul with high foot traffic.",
      location: { lat: 37.5665, lng: 126.978, address: "서울" },
      mediaType: MediaType.BILLBOARD,
      size: "10m x 5m",
      priceMin: 5000000,
      priceMax: 8000000,
      images: ["https://example.com/img1.jpg"],
      status: ProposalStatus.PENDING,
    },
    {
      id: IDS.proposals.gangnamDigital,
      userId: partner1.id,
      title: "Gangnam Digital Screen",
      description: "4K LED screen near Gangnam Station (day/night visibility).",
      location: { lat: 37.4981, lng: 127.0276, address: "서울 강남" },
      mediaType: MediaType.DIGITAL,
      size: "3840x2160",
      priceMin: 12000000,
      priceMax: 20000000,
      images: ["https://example.com/img2.jpg"],
      status: ProposalStatus.APPROVED,
    },
    {
      id: IDS.proposals.busShelter,
      userId: partner2.id,
      title: "Bus Shelter Transit Package",
      description: "Transit shelter poster slots along a commuter corridor.",
      location: { lat: 37.571, lng: 126.9768, address: "서울 종로" },
      mediaType: MediaType.TRANSIT,
      size: "1200mm x 1800mm",
      priceMin: 1000000,
      priceMax: 2500000,
      images: ["https://example.com/img3.jpg"],
      status: ProposalStatus.PENDING,
    },
    {
      id: IDS.proposals.incheonAirport,
      userId: partner2.id,
      title: "Incheon Airport Digital OOH",
      description: "Digital OOH in airport terminal with international audience.",
      location: { lat: 37.4602, lng: 126.4407, address: "인천공항" },
      mediaType: MediaType.DIGITAL,
      size: "5760x3240",
      priceMin: 30000000,
      priceMax: 50000000,
      images: ["https://example.com/img4.jpg"],
      status: ProposalStatus.APPROVED,
    },
    {
      id: IDS.proposals.tokyoSample,
      userId: partner1.id,
      title: "Tokyo Shibuya Billboard (Sample)",
      description: "Sample listing for Tokyo with placeholder details.",
      location: { lat: 35.6595, lng: 139.7005, address: "Tokyo, Shibuya" },
      mediaType: MediaType.OTHER,
      size: "8m x 4m",
      priceMin: 15000000,
      priceMax: 28000000,
      images: ["https://example.com/img5.jpg"],
      status: ProposalStatus.PENDING,
    },
  ];

  for (const p of proposalInputs) {
    await prisma.mediaProposal.upsert({
      where: { id: p.id },
      create: p,
      update: {
        userId: p.userId,
        title: p.title,
        description: p.description,
        location: p.location,
        mediaType: p.mediaType,
        size: p.size,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        images: Array.from(p.images),
        status: p.status,
      },
    });
  }

  // 테스트 매체 제안서 20개 자동 추가 (partner1/partner2 번갈아, PENDING, 랜덤 데이터)
  const LOCATIONS: Array<{ lat: number; lng: number; address: string }> = [
    { lat: 37.5665, lng: 126.978, address: "서울특별시 중구" },
    { lat: 37.4981, lng: 127.0276, address: "서울 강남구 역삼동" },
    { lat: 35.1796, lng: 129.0756, address: "부산광역시 해운대구" },
    { lat: 33.4996, lng: 126.5312, address: "제주특별자치도 제주시" },
    { lat: 37.4602, lng: 126.4407, address: "인천광역시 중구 인천공항" },
    { lat: 40.7128, lng: -74.006, address: "New York, NY, USA" },
  ];

  const MEDIA_TYPES = [MediaType.BILLBOARD, MediaType.DIGITAL, MediaType.TRANSIT] as const;
  const TITLE_PREFIXES = [
    "서울 강남",
    "부산 해운대",
    "제주 공항",
    "인천 송도",
    "서울 홍대",
    "뉴욕 맨해튼",
  ];
  const PLACEHOLDER_IMAGES = [
    "https://placehold.co/800x600?text=Media+1",
    "https://placehold.co/800x600?text=Media+2",
    "https://placehold.co/800x600?text=Media+3",
  ];

  function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick<T>(arr: readonly T[]): T {
    return arr[randomInt(0, arr.length - 1)]!;
  }

  const EXTRA_COUNT = 20;
  for (let i = 0; i < EXTRA_COUNT; i++) {
    const userId = i % 2 === 0 ? partner1.id : partner2.id;
    const num = i + 1;
    const prefix = pick(TITLE_PREFIXES);
    const mediaType = pick(MEDIA_TYPES);
    const typeLabel = mediaType === MediaType.BILLBOARD ? "빌보드" : mediaType === MediaType.DIGITAL ? "디지털 보드" : "트랜짓";
    const title = `${prefix} ${num}호 ${typeLabel}`;
    const location = pick(LOCATIONS);
    const imageCount = randomInt(1, 3);
    const images = Array.from({ length: imageCount }, (_, j) =>
      PLACEHOLDER_IMAGES[j % PLACEHOLDER_IMAGES.length]!
    );
    const priceMin = randomInt(3_000_000, 25_000_000);
    const priceMax = Math.min(30_000_000, priceMin + randomInt(1_000_000, 10_000_000));

    const id = `f${String(i).padStart(7, "0")}-4000-8000-8000-${String(i).padStart(12, "0")}`;
    await prisma.mediaProposal.upsert({
      where: { id },
      create: {
        id,
        userId,
        title,
        description: `테스트 매체 제안서 ${num}. ${prefix} 지역 ${typeLabel} 상세 설명입니다.`,
        location,
        mediaType,
        size: mediaType === MediaType.DIGITAL ? "3840x2160" : "10m x 5m",
        priceMin,
        priceMax,
        images,
        status: ProposalStatus.PENDING,
      },
      update: {
        userId,
        title,
        description: `테스트 매체 제안서 ${num}. ${prefix} 지역 ${typeLabel} 상세 설명입니다.`,
        location,
        mediaType,
        size: mediaType === MediaType.DIGITAL ? "3840x2160" : "10m x 5m",
        priceMin,
        priceMax,
        images,
        status: ProposalStatus.PENDING,
      },
    });
  }

  // Add (idempotent) review logs for approved items
  const approvedIds = proposalInputs
    .filter((p) => p.status === ProposalStatus.APPROVED)
    .map((p) => p.id);

  await prisma.reviewLog.deleteMany({
    where: {
      reviewerId: admin.id,
      proposalId: { in: approvedIds as unknown as string[] },
      comment: "Seed: approved by admin",
    },
  });

  for (const proposalId of approvedIds) {
    await prisma.reviewLog.create({
      data: {
        proposalId,
        reviewerId: admin.id,
        decision: ProposalStatus.APPROVED,
        comment: "Seed: approved by admin",
        aiScore: 90,
      },
    });
  }

  // ── 테스트 문의 10개 (advertiser → 다양한 매체) ─────────────────
  const inquiryMediaIds = [
    IDS.media.coexKpopSquare,
    IDS.media.gangnamGlight,
    IDS.media.sinnonhyeonDsg,
    IDS.media.cheongdamSsTower,
    IDS.media.seongsuBando,
    IDS.media.seongsuStation,
    IDS.media.timesSquare,
    IDS.media.burjKhalifa,
    IDS.media.tokyoAdTruck,
    IDS.media.londonPiccadilly,
  ];

  const inquiryMessages = [
    "2주간 브랜드 론칭 광고를 집행하고 싶습니다. 가용 기간과 할인 가능 여부를 알려주세요.",
    "다음 달 프로모션 기간에 맞춰 광고 집행이 가능할까요? 크리에이티브 규격도 알고 싶습니다.",
    "We'd like to run a 4-week awareness campaign for our new product. Please share availability.",
    "来月のキャンペーンに向けてこの媒体を利用したいです。詳細をお願いします。",
    "Can you provide a bulk discount for 3 months continuous booking?",
    "우리 브랜드의 타겟 고객이 20-30대 여성입니다. 이 매체가 적합한지 데이터를 공유해주세요.",
    "Looking for premium placement for a luxury brand launch. Is prime-time slot available?",
    "年末キャンペーン用に予約したいです。空き状況を教えてください。",
    "해외 브랜드 한국 진출 광고입니다. 영어/한국어 크리에이티브 모두 가능한가요?",
    "We represent a global FMCG brand. Interested in a cross-city package (Seoul + Tokyo).",
  ];

  const INQUIRY_ID_PREFIX = "fade1000-1000-4000-a000-";
  for (let i = 0; i < 10; i++) {
    const inquiryId = `${INQUIRY_ID_PREFIX}${String(i + 1).padStart(12, "0")}`;
    await prisma.inquiry.upsert({
      where: { id: inquiryId },
      create: {
        id: inquiryId,
        advertiserId: advertiser.id,
        mediaId: inquiryMediaIds[i]!,
        message: inquiryMessages[i]!,
        desiredPeriod: i % 2 === 0 ? "2주" : "4주",
        budget: (i + 1) * 5_000_000,
        contactEmail: "advertiser@xthex.test",
        status: i < 3 ? "REPLIED" : i < 7 ? "PENDING" : "CLOSED",
      },
      update: {
        message: inquiryMessages[i]!,
        status: i < 3 ? "REPLIED" : i < 7 ? "PENDING" : "CLOSED",
      },
    });
  }
  console.log("[seed] 테스트 문의 10개 upsert 완료");

  await ensureHashedPasswordsForClerkUsers(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });

