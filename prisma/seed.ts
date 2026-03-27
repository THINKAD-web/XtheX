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
  },
  proposals: {
    seoulBillboard: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    gangnamDigital: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    busShelter: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    incheonAirport: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    tokyoSample: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  },
  media: {
    gangnamLed:        "fade0001-0001-4000-a000-000000000001",
    coexDigital:       "fade0002-0002-4000-a000-000000000002",
    hongdaeTransit:    "fade0003-0003-4000-a000-000000000003",
    sinchonShelter:    "fade0004-0004-4000-a000-000000000004",
    gwanghwamun:       "fade0005-0005-4000-a000-000000000005",
    myeongdongDigital: "fade0006-0006-4000-a000-000000000006",
    shibuyaBillboard:  "fade0007-0007-4000-a000-000000000007",
    shinjukuDigital:   "fade0008-0008-4000-a000-000000000008",
    harajukuFurniture: "fade0009-0009-4000-a000-000000000009",
    tokyoTransit:      "fade000a-000a-4000-a000-00000000000a",
    timesSquareLed:    "fade000b-000b-4000-a000-00000000000b",
    manhattanDigital:  "fade000c-000c-4000-a000-00000000000c",
    nycSubway:         "fade000d-000d-4000-a000-00000000000d",
    lujiazuiBillboard: "fade000e-000e-4000-a000-00000000000e",
    nanjingDigital:    "fade000f-000f-4000-a000-00000000000f",
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

  // ── Media 테스트 매체 15개 (미디어믹스 AI 검색용) ──────────────
  const mediaInputs = [
    // Seoul (6)
    {
      id: IDS.media.gangnamLed,
      mediaName: "강남역 메가 LED 빌보드",
      category: MediaCategory.BILLBOARD,
      description: "강남역 사거리 초대형 LED 빌보드. 유동인구 일평균 30만 명, 24시간 운영.",
      locationJson: { address: "서울특별시 강남구 강남대로", district: "강남구", lat: 37.498, lng: 127.0276 },
      price: 15_000_000, cpm: 12_000,
      exposureJson: { daily_traffic: 300000, monthly_impressions: 9000000 },
      images: ["https://placehold.co/800x600?text=Gangnam+LED"],
      tags: ["LED", "빌보드", "강남", "대형"], audienceTags: ["직장인", "20-40대", "쇼핑"],
      trustScore: 92, status: MediaStatus.PUBLISHED,
      globalCountryCode: "KR", currency: CurrencyCode.KRW,
      createdById: partner1.id,
    },
    {
      id: IDS.media.coexDigital,
      mediaName: "코엑스 디지털 사이니지",
      category: MediaCategory.DIGITAL_BOARD,
      description: "코엑스몰 중앙 아트리움 4K 디지털 사이니지. 쇼핑·전시 방문객 대상.",
      locationJson: { address: "서울특별시 강남구 영동대로", district: "강남구", lat: 37.5131, lng: 127.059 },
      price: 8_000_000, cpm: 8_000,
      exposureJson: { daily_traffic: 150000, monthly_impressions: 4500000 },
      images: ["https://placehold.co/800x600?text=COEX+Digital"],
      tags: ["디지털", "사이니지", "코엑스", "실내"], audienceTags: ["쇼핑객", "관광객", "20-30대"],
      trustScore: 88, status: MediaStatus.PUBLISHED,
      globalCountryCode: "KR", currency: CurrencyCode.KRW,
      createdById: partner1.id,
    },
    {
      id: IDS.media.hongdaeTransit,
      mediaName: "홍대입구역 지하철 광고",
      category: MediaCategory.TRANSIT,
      description: "홍대입구역 2호선 승강장 및 통로 조명 광고. MZ세대 밀집 지역.",
      locationJson: { address: "서울특별시 마포구 홍대입구역", district: "마포구", lat: 37.5572, lng: 126.9237 },
      price: 3_000_000, cpm: 5_000,
      exposureJson: { daily_traffic: 200000, monthly_impressions: 6000000 },
      images: ["https://placehold.co/800x600?text=Hongdae+Transit"],
      tags: ["지하철", "교통", "홍대", "조명광고"], audienceTags: ["MZ세대", "대학생", "20대"],
      trustScore: 85, status: MediaStatus.PUBLISHED,
      globalCountryCode: "KR", currency: CurrencyCode.KRW,
      createdById: partner2.id,
    },
    {
      id: IDS.media.sinchonShelter,
      mediaName: "신촌 버스쉘터",
      category: MediaCategory.STREET_FURNITURE,
      description: "신촌로 버스정류장 쉘터 광고. 대학가 유동인구 높은 위치.",
      locationJson: { address: "서울특별시 서대문구 신촌로", district: "서대문구", lat: 37.5596, lng: 126.9366 },
      price: 1_500_000, cpm: 3_000,
      exposureJson: { daily_traffic: 80000, monthly_impressions: 2400000 },
      images: ["https://placehold.co/800x600?text=Sinchon+Shelter"],
      tags: ["버스쉘터", "가로시설물", "신촌", "대학가"], audienceTags: ["대학생", "20대", "직장인"],
      trustScore: 80, status: MediaStatus.PUBLISHED,
      globalCountryCode: "KR", currency: CurrencyCode.KRW,
      createdById: partner2.id,
    },
    {
      id: IDS.media.gwanghwamun,
      mediaName: "광화문 대형 옥외광고",
      category: MediaCategory.BILLBOARD,
      description: "세종대로 광화문 광장 인근 초대형 옥외광고. 관광·비즈니스 핵심 입지.",
      locationJson: { address: "서울특별시 종로구 세종대로", district: "종로구", lat: 37.5759, lng: 126.9769 },
      price: 20_000_000, cpm: 15_000,
      exposureJson: { daily_traffic: 400000, monthly_impressions: 12000000 },
      images: ["https://placehold.co/800x600?text=Gwanghwamun+OOH"],
      tags: ["빌보드", "광화문", "대형", "랜드마크"], audienceTags: ["관광객", "직장인", "전 연령대"],
      trustScore: 95, status: MediaStatus.PUBLISHED,
      globalCountryCode: "KR", currency: CurrencyCode.KRW,
      createdById: partner1.id,
    },
    {
      id: IDS.media.myeongdongDigital,
      mediaName: "명동 디지털 보드",
      category: MediaCategory.DIGITAL_BOARD,
      description: "명동 메인 거리 디지털 보드. 해외 관광객 + 국내 쇼핑객 동시 타겟.",
      locationJson: { address: "서울특별시 중구 명동길", district: "중구", lat: 37.5636, lng: 126.9849 },
      price: 6_000_000, cpm: 7_000,
      exposureJson: { daily_traffic: 250000, monthly_impressions: 7500000 },
      images: ["https://placehold.co/800x600?text=Myeongdong+Digital"],
      tags: ["디지털", "명동", "관광", "쇼핑"], audienceTags: ["관광객", "쇼핑객", "20-40대"],
      trustScore: 87, status: MediaStatus.PUBLISHED,
      globalCountryCode: "KR", currency: CurrencyCode.KRW,
      createdById: partner2.id,
    },
    // Tokyo (4)
    {
      id: IDS.media.shibuyaBillboard,
      mediaName: "시부야 스크램블 빌보드",
      category: MediaCategory.BILLBOARD,
      description: "Shibuya Scramble Crossing billboard. 日本最大級のOOH。1日歩行者数50万人以上。",
      locationJson: { address: "渋谷区道玄坂", district: "渋谷区", lat: 35.6595, lng: 139.7004 },
      price: 50_000_000, cpm: 20_000,
      exposureJson: { daily_traffic: 500000, monthly_impressions: 15000000 },
      images: ["https://placehold.co/800x600?text=Shibuya+Billboard"],
      tags: ["billboard", "shibuya", "landmark", "LED"], audienceTags: ["tourists", "youth", "all-ages"],
      trustScore: 96, status: MediaStatus.PUBLISHED,
      globalCountryCode: "JP", currency: CurrencyCode.JPY,
      createdById: partner1.id,
    },
    {
      id: IDS.media.shinjukuDigital,
      mediaName: "신주쿠 디지털 사이니지",
      category: MediaCategory.DIGITAL_BOARD,
      description: "新宿駅東口 大型LEDビジョン。通勤・エンタメ客が集まるエリア。",
      locationJson: { address: "新宿区新宿", district: "新宿区", lat: 35.6896, lng: 139.6917 },
      price: 30_000_000, cpm: 18_000,
      exposureJson: { daily_traffic: 350000, monthly_impressions: 10500000 },
      images: ["https://placehold.co/800x600?text=Shinjuku+Digital"],
      tags: ["digital", "shinjuku", "LED", "station"], audienceTags: ["commuters", "entertainment", "20-40s"],
      trustScore: 90, status: MediaStatus.PUBLISHED,
      globalCountryCode: "JP", currency: CurrencyCode.JPY,
      createdById: partner1.id,
    },
    {
      id: IDS.media.harajukuFurniture,
      mediaName: "하라주쿠 가로 시설물",
      category: MediaCategory.STREET_FURNITURE,
      description: "原宿・表参道エリアのストリートファニチャー広告。ファッション感度の高い若者層にリーチ。",
      locationJson: { address: "渋谷区神宮前", district: "渋谷区", lat: 35.6702, lng: 139.7027 },
      price: 8_000_000, cpm: 6_000,
      exposureJson: { daily_traffic: 120000, monthly_impressions: 3600000 },
      images: ["https://placehold.co/800x600?text=Harajuku+Furniture"],
      tags: ["street-furniture", "harajuku", "fashion", "youth"], audienceTags: ["teens", "fashion", "tourists"],
      trustScore: 82, status: MediaStatus.PUBLISHED,
      globalCountryCode: "JP", currency: CurrencyCode.JPY,
      createdById: partner2.id,
    },
    {
      id: IDS.media.tokyoTransit,
      mediaName: "도쿄역 교통 광고",
      category: MediaCategory.TRANSIT,
      description: "東京駅構内デジタルサイネージ。ビジネス客・観光客のハブ。",
      locationJson: { address: "千代田区丸の内", district: "千代田区", lat: 35.6812, lng: 139.7671 },
      price: 15_000_000, cpm: 10_000,
      exposureJson: { daily_traffic: 450000, monthly_impressions: 13500000 },
      images: ["https://placehold.co/800x600?text=Tokyo+Station+Transit"],
      tags: ["transit", "tokyo-station", "digital", "commuter"], audienceTags: ["business", "commuters", "tourists"],
      trustScore: 91, status: MediaStatus.PUBLISHED,
      globalCountryCode: "JP", currency: CurrencyCode.JPY,
      createdById: partner2.id,
    },
    // New York (3)
    {
      id: IDS.media.timesSquareLed,
      mediaName: "타임스스퀘어 대형 LED",
      category: MediaCategory.BILLBOARD,
      description: "Times Square mega LED billboard. The world's most iconic advertising location.",
      locationJson: { address: "Times Square, Manhattan, NY", district: "Manhattan", lat: 40.758, lng: -73.9855 },
      price: 200_000_000, cpm: 30_000,
      exposureJson: { daily_traffic: 330000, monthly_impressions: 10000000 },
      images: ["https://placehold.co/800x600?text=Times+Square+LED"],
      tags: ["billboard", "LED", "times-square", "landmark"], audienceTags: ["tourists", "all-ages", "global"],
      trustScore: 98, status: MediaStatus.PUBLISHED,
      globalCountryCode: "US", currency: CurrencyCode.USD,
      createdById: partner1.id,
    },
    {
      id: IDS.media.manhattanDigital,
      mediaName: "맨해튼 디지털 보드",
      category: MediaCategory.DIGITAL_BOARD,
      description: "Midtown Manhattan premium digital board. High-density business and retail corridor.",
      locationJson: { address: "Midtown Manhattan, NY", district: "Manhattan", lat: 40.7549, lng: -73.984 },
      price: 80_000_000, cpm: 25_000,
      exposureJson: { daily_traffic: 200000, monthly_impressions: 6000000 },
      images: ["https://placehold.co/800x600?text=Manhattan+Digital"],
      tags: ["digital", "manhattan", "midtown", "premium"], audienceTags: ["business", "retail", "30-50s"],
      trustScore: 93, status: MediaStatus.PUBLISHED,
      globalCountryCode: "US", currency: CurrencyCode.USD,
      createdById: partner1.id,
    },
    {
      id: IDS.media.nycSubway,
      mediaName: "뉴욕 지하철 광고",
      category: MediaCategory.TRANSIT,
      description: "NYC Subway in-car and platform advertising. Reaches 5.5M daily riders.",
      locationJson: { address: "NYC Subway System, NY", district: "NYC", lat: 40.7128, lng: -74.006 },
      price: 20_000_000, cpm: 8_000,
      exposureJson: { daily_traffic: 5500000, monthly_impressions: 165000000 },
      images: ["https://placehold.co/800x600?text=NYC+Subway"],
      tags: ["transit", "subway", "NYC", "in-car"], audienceTags: ["commuters", "all-ages", "diverse"],
      trustScore: 89, status: MediaStatus.PUBLISHED,
      globalCountryCode: "US", currency: CurrencyCode.USD,
      createdById: partner2.id,
    },
    // Shanghai (2)
    {
      id: IDS.media.lujiazuiBillboard,
      mediaName: "루자쭈이 빌보드",
      category: MediaCategory.BILLBOARD,
      description: "陆家嘴金融中心超大型LED广告牌。上海金融核心区，日均客流量25万人。",
      locationJson: { address: "陆家嘴金融中心, 上海", district: "浦东新区", lat: 31.2397, lng: 121.4998 },
      price: 100_000_000, cpm: 22_000,
      exposureJson: { daily_traffic: 250000, monthly_impressions: 7500000 },
      images: ["https://placehold.co/800x600?text=Lujiazui+Billboard"],
      tags: ["billboard", "lujiazui", "LED", "finance"], audienceTags: ["business", "finance", "30-50s"],
      trustScore: 90, status: MediaStatus.PUBLISHED,
      globalCountryCode: "CN", currency: CurrencyCode.KRW,
      createdById: partner1.id,
    },
    {
      id: IDS.media.nanjingDigital,
      mediaName: "난징로 디지털 사이니지",
      category: MediaCategory.DIGITAL_BOARD,
      description: "南京路步行街デジタルサイネージ。上海最大の商業エリア、観光客・買い物客に最適。",
      locationJson: { address: "南京路步行街, 上海", district: "黄浦区", lat: 31.2344, lng: 121.4733 },
      price: 60_000_000, cpm: 20_000,
      exposureJson: { daily_traffic: 400000, monthly_impressions: 12000000 },
      images: ["https://placehold.co/800x600?text=Nanjing+Road+Digital"],
      tags: ["digital", "nanjing-road", "shopping", "tourism"], audienceTags: ["tourists", "shoppers", "all-ages"],
      trustScore: 86, status: MediaStatus.PUBLISHED,
      globalCountryCode: "CN", currency: CurrencyCode.KRW,
      createdById: partner2.id,
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
        price: m.price,
        cpm: m.cpm,
        exposureJson: m.exposureJson,
        images: m.images,
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
  console.log(`[seed] Media 매체 ${mediaInputs.length}개 upsert 완료`);

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

