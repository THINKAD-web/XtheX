/**
 * OpenAI-compatible chat: xAI Grok, Groq, OpenAI.
 * - xai-… 키 → api.x.ai (또는 XAI_API_KEY / GROK_API_KEY 이름으로 넣는 경우)
 * - gsk_… 키 → Groq (다른 사이트에서 쓰던 방식)
 */

export type ResolvedChatLlm = {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: "xai" | "groq" | "openai";
};

function pickGrokNamedKey(): string | undefined {
  const g = process.env.GROK_API_KEY?.trim();
  if (g) return g;
  return undefined;
}

export function resolveChatLlm(): ResolvedChatLlm | null {
  const xaiExplicit = process.env.XAI_API_KEY?.trim();
  const grokNamed = pickGrokNamedKey();

  const xaiKey =
    xaiExplicit ||
    (grokNamed?.startsWith("xai-") ? grokNamed : undefined);
  if (xaiKey) {
    const base = (
      process.env.XAI_API_BASE_URL || "https://api.x.ai/v1"
    ).replace(/\/$/, "");
    // grok-2-latest 등 구 모델명은 API에서 더 이상 안 됨 → console.x.ai Models 참고
    const model =
      process.env.XAI_MODEL?.trim() ||
      process.env.GROK_MODEL?.trim() ||
      "grok-3";
    // PDF Vision 멀티모달은 XAI_VISION_MODEL 별도 지정 권장(콘솔 Models)
    return { apiKey: xaiKey, baseUrl: base, model, provider: "xai" };
  }

  const groqKey =
    process.env.GROQ_API_KEY?.trim() ||
    (grokNamed?.startsWith("gsk_") ? grokNamed : undefined);
  if (groqKey) {
    const base = (
      process.env.GROQ_API_BASE_URL || "https://api.groq.com/openai/v1"
    ).replace(/\/$/, "");
    const model =
      process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
    return { apiKey: groqKey, baseUrl: base, model, provider: "groq" };
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return {
      apiKey: openaiKey,
      baseUrl: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      provider: "openai",
    };
  }
  return null;
}

export function hasChatLlm(): boolean {
  return resolveChatLlm() !== null;
}

/** OpenAI/xAI 호환 멀티모달 메시지 조각 */
export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ChatMessageInput = {
  role: string;
  content: string | ChatContentPart[];
};

export async function chatCompletions(
  cfg: ResolvedChatLlm,
  body: {
    messages: ChatMessageInput[];
    temperature?: number;
    max_tokens?: number;
    /** xAI / OpenAI JSON mode when supported */
    response_format?: { type: "json_object" };
    /** Vision 등 별도 모델 (xAI 기본: XAI_VISION_MODEL=grok-4) */
    modelOverride?: string;
  },
): Promise<string> {
  const payload: Record<string, unknown> = {
    model: body.modelOverride?.trim() || cfg.model,
    temperature: body.temperature ?? 0.2,
    max_tokens: body.max_tokens ?? 4096,
    messages: body.messages,
  };
  if (body.response_format && (cfg.provider === "xai" || cfg.provider === "openai")) {
    payload.response_format = body.response_format;
  }

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    const name =
      cfg.provider === "xai"
        ? "xAI Grok"
        : cfg.provider === "groq"
          ? "Groq"
          : "OpenAI";
    throw new Error(`${name} API 오류: ${res.status} ${err.slice(0, 500)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json?.choices?.[0]?.message?.content;
  if (!text) {
    const empty =
      cfg.provider === "xai"
        ? "Grok 응답이 비어 있습니다."
        : cfg.provider === "groq"
          ? "Groq 응답이 비어 있습니다."
          : "OpenAI 응답이 비어 있습니다.";
    throw new Error(empty);
  }
  return text;
}
