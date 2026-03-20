"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { findUserByClerkId } from "@/lib/auth/find-user-by-clerk";
import {
  mediaProposalSchema,
  type MediaProposalFormValues,
} from "@/components/partner/media-proposal-schema";
import { MediaType, ProposalStatus, UserRole } from "@prisma/client";
import { reviewProposalById } from "@/lib/ai/reviewProposal";
import { z, ZodError } from "zod";
import { revalidatePath } from "next/cache";

async function ensureDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const email =
    clerkUser.emailAddresses[0]?.emailAddress ??
    (clerkUser.primaryEmailAddress?.emailAddress as string | undefined);

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    null;

  const fallbackEmail =
    email ||
    (clerkUser.primaryEmailAddress?.emailAddress as string | undefined) ||
    `partner_${userId.slice(0, 8)}@xthex.local`;

  const dbUser =
    (await findUserByClerkId(userId)) ??
    (await prisma.user.create({
      data: {
        clerkId: userId,
        email: fallbackEmail,
        name,
        role: UserRole.MEDIA_OWNER,
        onboardingCompleted: true,
      },
    }));

  return dbUser;
}

export async function createMediaProposal(input: unknown) {
  const t = await getTranslations("dashboard.partner");
  let dbUser;
  try {
    dbUser = await ensureDbUser();
  } catch {
    throw new Error(t("errors.submit_failed"));
  }
  if (dbUser.role !== UserRole.MEDIA_OWNER) {
    throw new Error(t("errors.submit_failed"));
  }

  let parsed: MediaProposalFormValues;
  try {
    parsed = mediaProposalSchema.parse(input);
  } catch (e) {
    if (e instanceof ZodError) {
      const first = e.issues[0];
      const key = first?.message;
      const msg =
        typeof key === "string" && key.startsWith("errors.")
          ? t(key as `errors.${string}`)
          : first
            ? `${first.path.join(".")}: ${first.message}`
            : String((e as Error).message);
      throw new Error(msg);
    }
    throw new Error(t("errors.submit_failed"));
  }

  const location = parsed.location as { lat: number; lng: number; address: string };
  const size = parsed.size && parsed.size.trim() !== "" ? parsed.size.trim() : null;

  const created = await prisma.mediaProposal.create({
    data: {
      userId: dbUser.id,
      title: parsed.title,
      description: parsed.description,
      location,
      mediaType: parsed.mediaType as unknown as MediaType,
      size,
      priceMin: parsed.priceMin,
      priceMax: parsed.priceMax,
      images: parsed.imageUrls,
      status: ProposalStatus.PENDING,
    },
  });

  revalidatePath("/dashboard/partner");

  // Trigger AI review immediately after creation.
  // (If no AI key is set, this will throw and the proposal remains PENDING.)
  try {
    await reviewProposalById(created.id);
  } catch {
    // keep PENDING if review fails
  }

  return { id: created.id };
}

const simpleProposalSchema = z.object({
  title: z.string().min(2, "제목은 최소 2자 이상이어야 합니다."),
  description: z.string().max(1000, "설명은 최대 1000자까지 입력 가능합니다."),
});

export type SimpleProposalInput = z.infer<typeof simpleProposalSchema>;

const grokAnalysisSchema = z.object({
  keywords: z.array(z.string()).max(10),
  mediaTypes: z.array(z.string()).max(10),
  summary: z.string().max(1000),
  tone: z.string().max(50),
});

async function analyzeWithGrok(input: {
  id: string;
  title: string;
  description: string;
}) {
  const apiKey = process.env.GROK_API_KEY;

  // 디버깅용 환경 변수 로그
  // eslint-disable-next-line no-console
  console.log("읽은 GROK_API_KEY:", apiKey ? "[set]" : "키 없음");

  if (!apiKey) {
    return { ok: false as const, error: "GROK_API_KEY not set" };
  }

  try {
    // 1) 상태를 ANALYZING 으로 먼저 업데이트
    await prisma.mediaProposal.update({
      where: { id: input.id },
      data: { status: ProposalStatus.ANALYZING },
    });

    // 2) 프롬프트 (간단 + JSON 강제)
    const prompt = [
      "다음 제안서를 분석해서 JSON으로만 출력하세요.",
      `제목: ${input.title}`,
      `내용: ${input.description}`,
      "",
      "- keywords: 주요 키워드 5개 (string 배열)",
      "- mediaTypes: 적합한 매체 유형 3개 (언론사, 유튜브, 인스타, 블로그, 팟캐스트 등)",
      "- summary: 보도자료 스타일 요약문 100자 이내",
      "- tone: 감정 톤 (긍정/부정/중립) + 주요 이슈 한 줄",
      "",
      "반드시 JSON 객체만 출력하세요. JSON 외 텍스트 절대 추가 금지!",
      "JSON만 출력하세요. 설명 없음!",
      '예시: { "keywords": ["a", "b"], "mediaTypes": ["c"], "summary": "d", "tone": "e" }',
    ].join("\n");

    // 3) Grok 요청 바디
    const body = {
      model: "grok-4-1-fast-non-reasoning",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that analyzes advertising proposals and responds strictly in JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    // 디버깅용 요청 바디 로그
    // eslint-disable-next-line no-console
    console.log("Grok 요청 body:", JSON.stringify(body, null, 2));

    // 4) Grok API 호출 (response_format 완전 제거)
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    // 5) HTTP 에러 처리 + 상세 로그
    if (!res.ok) {
      const errorBody = await res.text();
      // eslint-disable-next-line no-console
      console.error("Grok 400 상세 에러:", res.status, errorBody);
      throw new Error(`Grok API error: ${res.status} - ${errorBody}`);
    }

    // 6) 응답 파싱
    const data = await res.json();
    const content =
      data.choices?.[0]?.message?.content ??
      data.choices?.[0]?.message?.content?.[0]?.text;

    if (!content || typeof content !== "string") {
      throw new Error("Invalid Grok response content");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      throw new Error("Failed to parse Grok JSON content");
    }

    // 원본 JSON 로그
    // eslint-disable-next-line no-console
    console.log("Grok 응답 JSON:", parsedJson);

    // 7) 스키마 검증
    const validated = grokAnalysisSchema.parse(parsedJson);

    // 8) 성공 시 ANALYZED + 분석 결과 저장
    await prisma.mediaProposal.update({
      where: { id: input.id },
      data: {
        keywords: validated.keywords,
        mediaTypes: validated.mediaTypes,
        summary: validated.summary,
        tone: validated.tone,
        status: ProposalStatus.ANALYZED,
      },
    });

    // 9) 대시보드 최신화
    revalidatePath("/[locale]/dashboard/partner");

    return { ok: true as const };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Grok error:", error);
    // 실패 시 상태를 FAILED 로 표시
    try {
      await prisma.mediaProposal.update({
        where: { id: input.id },
        data: { status: ProposalStatus.FAILED },
      });
    } catch (updateError) {
      // eslint-disable-next-line no-console
      console.error("Grok FAILED status update error:", updateError);
    }
    return {
      ok: false as const,
      error:
        error instanceof Error ? error.message : "Grok 분석 중 오류가 발생했습니다.",
    };
  }
}

export async function createProposal(input: SimpleProposalInput) {
  const t = await getTranslations("dashboard.partner");
  let dbUser;
  try {
    dbUser = await ensureDbUser();
  } catch {
    return {
      ok: false as const,
      error: t("errors.submit_failed"),
    };
  }

  if (dbUser.role !== UserRole.MEDIA_OWNER) {
    return {
      ok: false as const,
      error: t("errors.submit_failed"),
    };
  }

  const parsed = simpleProposalSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false as const,
      error: first?.message ?? t("errors.submit_failed"),
    };
  }

  const { title, description } = parsed.data;

  const created = await prisma.mediaProposal.create({
    data: {
      userId: dbUser.id,
      title,
      description,
      // 최소 정보만 채우는 간단 업로드용
      location: {},
      mediaType: MediaType.OTHER,
      size: null,
      priceMin: null,
      priceMax: null,
      images: [],
      status: ProposalStatus.PENDING,
    },
  });

  // Grok 분석 실행 (실패해도 업로드 자체는 성공으로 처리)
  const analysis = await analyzeWithGrok({
    id: created.id,
    title,
    description: description ?? "",
  });

  // 다국어 라우트 전체를 다시 불러오도록 패턴 경로를 revalidate
  revalidatePath("/[locale]/dashboard/partner");

  return {
    ok: true as const,
    id: created.id,
    analysisError: analysis.ok ? undefined : analysis.error,
  };
}

