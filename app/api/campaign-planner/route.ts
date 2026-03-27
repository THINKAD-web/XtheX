import { NextResponse } from "next/server";
import {
  resolveChatLlm,
  chatCompletions,
} from "@/lib/ai/openai-compatible-llm";

export type CampaignPlannerMedia = {
  id: string;
  name: string;
  mediaType: string;
  reason: string;
  estimatedCost: number;
  estimatedImpressions: number;
  estimatedReach: number;
};

export type CampaignPlannerResult = {
  medias: CampaignPlannerMedia[];
  totalCost: number;
  totalImpressions: number;
  totalReach: number;
  demo?: boolean;
};

const DEMO_RESULTS: CampaignPlannerResult = {
  demo: true,
  totalCost: 45_000_000,
  totalImpressions: 12_500_000,
  totalReach: 3_200_000,
  medias: [
    {
      id: "demo-1",
      name: "강남역 디지털 빌보드 A",
      mediaType: "DIGITAL_BOARD",
      reason:
        "강남역 일평균 유동인구 30만 명 중 20-30대 비율 65%. 높은 가시성과 도달률.",
      estimatedCost: 15_000_000,
      estimatedImpressions: 4_500_000,
      estimatedReach: 1_200_000,
    },
    {
      id: "demo-2",
      name: "신촌 대형 LED 전광판",
      mediaType: "BILLBOARD",
      reason:
        "대학가 밀집 지역으로 20대 타겟 적합. 야간 가시성 우수.",
      estimatedCost: 10_000_000,
      estimatedImpressions: 3_000_000,
      estimatedReach: 800_000,
    },
    {
      id: "demo-3",
      name: "홍대 버스정류장 쉘터",
      mediaType: "STREET_FURNITURE",
      reason:
        "홍대·합정 상권 유동 인구와 젊은 층 타겟 도보 접근성 우수.",
      estimatedCost: 5_000_000,
      estimatedImpressions: 2_000_000,
      estimatedReach: 500_000,
    },
    {
      id: "demo-4",
      name: "지하철 2호선 래핑",
      mediaType: "TRANSIT",
      reason:
        "강남-신촌-홍대 노선 커버. 통근 시간대 집중 노출로 반복 접촉 효과.",
      estimatedCost: 8_000_000,
      estimatedImpressions: 1_800_000,
      estimatedReach: 450_000,
    },
    {
      id: "demo-5",
      name: "이태원 외벽 대형 배너",
      mediaType: "WALL",
      reason:
        "외국 관광객·MZ세대 밀집 지역. 인스타그래머블 크리에이티브 적합.",
      estimatedCost: 7_000_000,
      estimatedImpressions: 1_200_000,
      estimatedReach: 250_000,
    },
  ],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      budget,
      targetAge,
      region,
      startDate,
      endDate,
    } = body as {
      budget: number;
      targetAge: string;
      region: string;
      startDate: string;
      endDate: string;
    };

    const cfg = resolveChatLlm();
    if (!cfg) {
      return NextResponse.json(DEMO_RESULTS);
    }

    const prompt = `You are an outdoor advertising media planning expert for the XtheX global OOH marketplace.

Given the following campaign brief, recommend 3-5 outdoor advertising media placements. Return ONLY valid JSON.

Campaign Brief:
- Budget: ${budget}만원 (${(budget * 10000).toLocaleString()} KRW)
- Target Age: ${targetAge}
- Region: ${region}
- Campaign Period: ${startDate} ~ ${endDate}

Available media types: BILLBOARD, DIGITAL_BOARD, TRANSIT, STREET_FURNITURE, WALL

For each recommended media, provide:
- id: a unique identifier (e.g. "rec-1")
- name: a realistic media name for the region (in Korean if region is Seoul, in English for New York, etc.)
- mediaType: one of the available types
- reason: 1-2 sentence explanation why this media fits the campaign (in Korean)
- estimatedCost: cost in KRW for the campaign period (integer)
- estimatedImpressions: estimated impression count (integer)
- estimatedReach: estimated unique reach (integer)

The total cost across all media should stay within or near the budget.

Return JSON in this exact format:
{
  "medias": [...],
  "totalCost": <sum of all estimatedCost>,
  "totalImpressions": <sum of all estimatedImpressions>,
  "totalReach": <sum of all estimatedReach>
}`;

    const raw = await chatCompletions(cfg, {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      medias: CampaignPlannerMedia[];
      totalCost: number;
      totalImpressions: number;
      totalReach: number;
    };

    return NextResponse.json({
      medias: parsed.medias,
      totalCost: parsed.totalCost,
      totalImpressions: parsed.totalImpressions,
      totalReach: parsed.totalReach,
    } satisfies CampaignPlannerResult);
  } catch (err) {
    console.error("[campaign-planner] Error:", err);
    return NextResponse.json(DEMO_RESULTS);
  }
}
