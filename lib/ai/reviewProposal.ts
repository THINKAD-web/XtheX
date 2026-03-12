import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ProposalStatus } from "@prisma/client";

const aiOutputSchema = z.object({
  approved: z.boolean(),
  score: z.number().min(0).max(100),
  reason: z.string().min(1),
});

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

async function callOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            'You are a strict reviewer. Output ONLY valid JSON with keys: approved(boolean), score(number 0-100), reason(string).',
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
  const json = (await res.json()) as any;
  const text: string | undefined = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI: empty response");
  return text;
}

async function callAnthropic(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
      system:
        'You are a strict reviewer. Output ONLY valid JSON with keys: approved(boolean), score(number 0-100), reason(string).',
    }),
  });

  if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`);
  const json = (await res.json()) as any;
  const text: string | undefined = json?.content?.[0]?.text;
  if (!text) throw new Error("Anthropic: empty response");
  return text;
}

function buildPrompt(proposal: {
  id: string;
  title: string;
  description: string;
  location: unknown;
  mediaType: string;
  size: string | null;
  priceMin: number | null;
  priceMax: number | null;
  images: string[];
}) {
  return [
    "이 옥외광고 제안서가 적합한지 검토:",
    "- 불법/부적절 콘텐츠 없나?",
    "- 위치 유효?",
    "- 설명 일관성?",
    '- 0~100 점수 주고 reason 설명. JSON 출력: {"approved": boolean, "score": number, "reason": string}',
    "",
    "제안서 데이터:",
    `id: ${proposal.id}`,
    `title: ${proposal.title}`,
    `description: ${proposal.description}`,
    `location(json): ${JSON.stringify(proposal.location)}`,
    `mediaType: ${proposal.mediaType}`,
    `size: ${proposal.size ?? ""}`,
    `priceMin: ${proposal.priceMin ?? ""}`,
    `priceMax: ${proposal.priceMax ?? ""}`,
    `images: ${proposal.images.length} files`,
  ].join("\n");
}

export async function reviewProposalById(proposalId: string) {
  const proposal = await prisma.mediaProposal.findUnique({
    where: { id: proposalId },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      location: true,
      mediaType: true,
      size: true,
      priceMin: true,
      priceMax: true,
      images: true,
      status: true,
    },
  });
  if (!proposal) throw new Error("Not found");

  const prompt = buildPrompt({
    id: proposal.id,
    title: proposal.title,
    description: proposal.description ?? "",
    location: proposal.location,
    mediaType: proposal.mediaType,
    size: proposal.size,
    priceMin: proposal.priceMin,
    priceMax: proposal.priceMax,
    images: proposal.images,
  });

  const useOpenAI = !!process.env.OPENAI_API_KEY;
  const useAnthropic = !!process.env.ANTHROPIC_API_KEY;
  if (!useOpenAI && !useAnthropic) {
    throw new Error("Missing OPENAI_API_KEY or ANTHROPIC_API_KEY");
  }

  const rawText = useOpenAI ? await callOpenAI(prompt) : await callAnthropic(prompt);
  const rawJson = extractJsonObject(rawText);
  const parsed = aiOutputSchema.parse(rawJson ?? {});

  const decision = parsed.approved ? ProposalStatus.APPROVED : ProposalStatus.REJECTED;

  await prisma.$transaction([
    prisma.reviewLog.create({
      data: {
        proposalId: proposal.id,
        reviewerId: null,
        decision,
        comment: parsed.reason,
        aiScore: parsed.score,
      },
    }),
    prisma.mediaProposal.update({
      where: { id: proposal.id },
      data: { status: decision },
    }),
  ]);

  return {
    proposalId: proposal.id,
    decision,
    score: parsed.score,
    reason: parsed.reason,
  };
}

