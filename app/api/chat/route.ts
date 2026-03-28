import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const AI_OFFLINE_REPLY: Record<string, string> = {
  ko: "XtheX는 전 세계 옥외광고 매체를 탐색·추천하는 플랫폼입니다. 홈의 미디어 믹스 검색이나 탐색(/explore)에서 지역·예산에 맞는 매체를 찾아보세요. 더 구체적인 상담은 채팅의 ‘실제 지원팀 연결’ 또는 문의 페이지를 이용해 주세요.",
  en: "XtheX helps you discover and plan global OOH. Try the media mix search on the home page or browse /explore for locations and budgets. For a human specialist, use “Connect to support team” in chat or our contact page.",
  ja: "XtheXは世界の屋外広告を探せるマーケットプレイスです。トップのミックス検索や/exploreで地域・予算から探せます。担当者はチャットの「サポートチームに接続」またはお問い合わせからどうぞ。",
  zh: "XtheX 覆盖全球户外广告资源。可在首页组合搜索或 /explore 按地区与预算查找。需要人工支持请使用聊天中的「连接支持团队」或联系页面。",
};

function offlineReply(locale: string): string {
  const loc = locale?.slice(0, 2) ?? "en";
  return AI_OFFLINE_REPLY[loc] ?? AI_OFFLINE_REPLY.en;
}

const SYSTEM_PROMPT = `당신은 XtheX의 AI 어시스턴트입니다. XtheX는 글로벌 옥외광고(OOH) 마켓플레이스로, 전 세계 매체사와 광고주를 AI로 연결합니다.

주요 기능:
- 서울, 도쿄, 뉴욕, 상하이 등 전 세계 OOH 매체 탐색
- AI 기반 미디어믹스 추천 (예산, 지역, 타겟 입력)
- 매체사 제안서 업로드 및 AI 파싱
- 다국어 지원 (한국어, 영어, 일본어, 중국어)

안내 방침:
- 친절하고 전문적으로 답변
- 구체적인 매체나 예산을 물어보면 /explore 페이지 또는 미디어믹스 검색을 추천
- 광고주에게는 /explore 페이지, 매체사에게는 /dashboard/media-owner 안내
- 한국어로 질문하면 한국어로, 영어로 질문하면 영어로, 일본어는 일본어로 답변
- 답변은 3-4문장으로 간결하게`;

export async function POST(req: NextRequest) {
  const { message, locale } = await req.json() as { message: string; locale: string };

  // 매체 관련 질문이면 DB에서 관련 매체 조회
  let mediaContext = "";
  if (/매체|광고|가격|견적|도쿄|서울|뉴욕|tokyo|seoul|new york|times square|시부야|渋谷|shibuya|상하이|shanghai/i.test(message)) {
    try {
      const medias = await prisma.media.findMany({
        where: { status: "PUBLISHED" },
        select: { mediaName: true, category: true, price: true, globalCountryCode: true },
        take: 8,
        orderBy: { viewCount: "desc" },
      });
      if (medias.length > 0) {
        mediaContext = "\n\n[현재 등록된 주요 매체 참고]\n" + medias.map(m =>
          `- ${m.mediaName} (${m.category}, ${m.globalCountryCode ?? "KR"}, ${m.price ? `₩${m.price.toLocaleString()}` : "가격 문의"})`
        ).join("\n");
      }
    } catch {
      // DB 에러는 무시하고 계속
    }
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: offlineReply(locale) });
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "grok-3",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + mediaContext },
          { role: "user", content: message },
        ],
        max_tokens: 400,
        stream: false,
      }),
    });

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!response.ok || !text) {
      return NextResponse.json({ reply: offlineReply(locale) });
    }
    return NextResponse.json({ reply: text });
  } catch {
    return NextResponse.json({ reply: offlineReply(locale) });
  }
}
