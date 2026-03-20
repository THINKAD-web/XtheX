import "dotenv/config";
import { MediaType, PrismaClient, ProposalStatus, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

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

