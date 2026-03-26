import type { MediaCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMockGlobalRecommendations } from "@/lib/recommend/mock-global-recommendations";
import type {
  RecommendationAgeBand,
  RecommendationCategory,
  RecommendationGender,
  RecommendationInterest,
  RecommendationItem,
} from "@/lib/recommend/recommendations-ui-types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function asObj(v: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function mapCategory(cat: MediaCategory): RecommendationCategory {
  if (cat === "TRANSIT") return "Transportation";
  if (cat === "DIGITAL_BOARD") return "Entertainment";
  if (cat === "STREET_FURNITURE") return "Retail";
  if (cat === "WALL") return "Food & Beverage";
  if (cat === "ETC") return "Residential";
  return "Retail";
}

function inferCountry(address: string): { code: string; country: string } {
  const s = address.toLowerCase();
  if (s.includes("seoul") || s.includes("korea") || s.includes("대한민국") || s.includes("서울")) {
    return { code: "KR", country: "Korea" };
  }
  if (s.includes("tokyo") || s.includes("japan") || s.includes("도쿄")) {
    return { code: "JP", country: "Japan" };
  }
  if (s.includes("shanghai") || s.includes("beijing") || s.includes("china") || s.includes("중국")) {
    return { code: "CN", country: "China" };
  }
  if (s.includes("new york") || s.includes("los angeles") || s.includes("united states") || s.includes("usa")) {
    return { code: "US", country: "United States" };
  }
  if (s.includes("london") || s.includes("united kingdom") || s.includes("uk")) {
    return { code: "GB", country: "United Kingdom" };
  }
  if (s.includes("paris") || s.includes("france")) {
    return { code: "FR", country: "France" };
  }
  if (s.includes("berlin") || s.includes("germany")) {
    return { code: "DE", country: "Germany" };
  }
  if (s.includes("madrid") || s.includes("spain")) {
    return { code: "ES", country: "Spain" };
  }
  if (s.includes("amsterdam") || s.includes("netherlands")) {
    return { code: "NL", country: "Netherlands" };
  }
  return { code: "KR", country: "Korea" };
}

function inferCity(location: Record<string, unknown> | null, address: string): string {
  const district = typeof location?.district === "string" ? location.district.trim() : "";
  if (district) return district;
  const commaPart = address.split(",")[0]?.trim();
  if (commaPart) return commaPart;
  return "Seoul";
}

function mapAges(tags: string[]): RecommendationAgeBand[] {
  const t = tags.join(" ").toLowerCase();
  const result: RecommendationAgeBand[] = [];
  if (t.includes("18") || t.includes("20")) result.push("18-24");
  if (t.includes("25") || t.includes("30")) result.push("25-34");
  if (t.includes("35") || t.includes("40")) result.push("35-44");
  if (t.includes("45") || t.includes("50")) result.push("45-54");
  if (t.includes("50+") || t.includes("senior")) result.push("55+");
  return result.length > 0 ? result : ["25-34", "35-44"];
}

function mapGender(tags: string[]): RecommendationGender {
  const t = tags.join(" ").toLowerCase();
  if (t.includes("female") || t.includes("women") || t.includes("여성")) return "FEMALE";
  if (t.includes("male") || t.includes("men") || t.includes("남성")) return "MALE";
  return "ALL";
}

function mapInterests(tags: string[]): RecommendationInterest[] {
  const t = tags.join(" ").toLowerCase();
  const out: RecommendationInterest[] = [];
  if (t.includes("luxury")) out.push("Luxury");
  if (t.includes("tech") || t.includes("it")) out.push("Tech");
  if (t.includes("travel")) out.push("Travel");
  if (t.includes("game")) out.push("Gaming");
  if (t.includes("food")) out.push("Food");
  if (t.includes("finance") || t.includes("bank")) out.push("Finance");
  if (t.includes("sport")) out.push("Sports");
  if (t.includes("beauty")) out.push("Beauty");
  return out.length > 0 ? out : ["Tech", "Travel"];
}

function fallbackAiReason(args: {
  city: string;
  category: RecommendationCategory;
  score: number;
}) {
  const ratio = clamp(Math.round(args.score * 0.72), 52, 93);
  return `${args.city} 권역 ${args.category} 타겟 적합도가 높고 주요 오디언스 일치율 ${ratio}%로 분석됩니다.`;
}

export async function getAdvertiserRecommendations(): Promise<RecommendationItem[]> {
  // TODO: Replace this mapper with dedicated AI recommendation service.
  // Current stage: Prisma media read + deterministic fallback scoring.
  const medias = await prisma.media.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    take: 120,
    select: {
      id: true,
      mediaName: true,
      category: true,
      description: true,
      locationJson: true,
      price: true,
      images: true,
      sampleImages: true,
      tags: true,
      audienceTags: true,
      trustScore: true,
      aiReviewScore: true,
      aiReviewComment: true,
      aiMatchScore: true,
      globalCountryCode: true,
      currency: true,
      viewCount: true,
      updatedAt: true,
    },
  });

  if (medias.length === 0) {
    return getMockGlobalRecommendations();
  }

  const items = medias.map((m): RecommendationItem => {
    const location = asObj(m.locationJson);
    const address = typeof location?.address === "string" ? location.address : "";
    const inferred = inferCountry(address);
    const countryCode = m.globalCountryCode?.trim().toUpperCase() || inferred.code;
    const countryName =
      countryCode === "KR"
        ? "Korea"
        : countryCode === "US"
          ? "United States"
          : countryCode === "JP"
            ? "Japan"
            : countryCode === "CN"
              ? "China"
            : countryCode === "GB"
              ? "United Kingdom"
            : countryCode === "DE"
              ? "Germany"
            : countryCode === "FR"
              ? "France"
            : countryCode === "IT"
              ? "Italy"
            : countryCode === "ES"
              ? "Spain"
            : countryCode === "NL"
              ? "Netherlands"
              : inferred.country;
    const city = inferCity(location, address);

    const scoreBase =
      m.aiMatchScore ??
      m.aiReviewScore ??
      m.trustScore ??
      clamp(58 + Math.round(Math.log10(m.viewCount + 10) * 18), 58, 90);
    const aiMatchScore = clamp(scoreBase, 40, 99);

    const imageUrl =
      m.sampleImages[0] ??
      m.images[0] ??
      `https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80`;

    const tags = [...m.tags, ...m.audienceTags];
    const category = mapCategory(m.category);

    return {
      id: m.id,
      mediaName: m.mediaName,
      imageUrl,
      city,
      country: countryName,
      globalCountryCode: countryCode,
      aiMatchScore,
      aiReason: m.aiReviewComment?.trim() || fallbackAiReason({ city, category, score: aiMatchScore }),
      monthlyPrice: m.price ?? 4_500_000,
      currency: m.currency,
      specSize: "Custom Size",
      specResolution: "1920x1080",
      category,
      targetAges: mapAges(tags),
      targetGender: mapGender(tags),
      interests: mapInterests(tags),
      updatedAt: m.updatedAt.toISOString(),
    };
  });

  return items.length > 0 ? items : getMockGlobalRecommendations();
}
