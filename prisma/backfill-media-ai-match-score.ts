import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function scoreMedia(args: {
  aiReviewScore: number | null;
  trustScore: number | null;
  viewCount: number;
  price: number | null;
  cpm: number | null;
  exposureJson: unknown;
  tags: string[];
  audienceTags: string[];
}): number {
  if (typeof args.aiReviewScore === "number") return clamp(args.aiReviewScore, 40, 99);
  if (typeof args.trustScore === "number") {
    const base = Math.round(args.trustScore * 0.78 + 12);
    return clamp(base, 40, 99);
  }

  const exposureObj =
    args.exposureJson &&
    typeof args.exposureJson === "object" &&
    !Array.isArray(args.exposureJson)
      ? (args.exposureJson as Record<string, unknown>)
      : null;

  const dailyTraffic = num(exposureObj?.daily_traffic);
  const monthlyImpressions = num(exposureObj?.monthly_impressions);
  const exposureSignal = dailyTraffic ?? (monthlyImpressions ? monthlyImpressions / 30 : 12000);

  const viewSignal = Math.log10((args.viewCount ?? 0) + 10) * 16;
  const exposureScore = clamp(Math.log10(exposureSignal + 10) * 10, 4, 22);
  const priceSignal = args.price ?? (args.cpm ? (args.cpm * exposureSignal * 7) / 1000 : 4_500_000);
  const priceScore = priceSignal <= 3_000_000 ? 10 : priceSignal <= 8_000_000 ? 6 : 3;
  const tagScore = clamp((args.tags.length + args.audienceTags.length) * 1.2, 0, 14);

  const raw = 45 + viewSignal + exposureScore + priceScore + tagScore;
  return clamp(Math.round(raw), 40, 99);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL");
  }

  const pool = new Pool({ connectionString, max: 1 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const medias = await prisma.media.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        mediaName: true,
        aiReviewScore: true,
        trustScore: true,
        viewCount: true,
        price: true,
        cpm: true,
        exposureJson: true,
        tags: true,
        audienceTags: true,
        aiMatchScore: true,
      },
    });

    let changed = 0;
    for (const m of medias) {
      const next = scoreMedia({
        aiReviewScore: m.aiReviewScore,
        trustScore: m.trustScore,
        viewCount: m.viewCount,
        price: m.price,
        cpm: m.cpm,
        exposureJson: m.exposureJson,
        tags: m.tags,
        audienceTags: m.audienceTags,
      });

      if (m.aiMatchScore !== next) {
        await prisma.media.update({
          where: { id: m.id },
          data: { aiMatchScore: next },
        });
        changed += 1;
      }
    }

    console.log(
      JSON.stringify(
        {
          publishedCount: medias.length,
          updatedCount: changed,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
