/**
 * 사용자 업로드 매체 사진 1장 → Grok Vision 한국어 설명.
 */
import {
  chatCompletions,
  resolveChatLlm,
  type ResolvedChatLlm,
} from "@/lib/ai/openai-compatible-llm";

const PROMPT = `이 매체 사진을 분석해서 위치·크기·특징·환경을 한국어로 1~2문장 설명해줘. 예: "서울 강남 대로변 14m x 7m LED 빌보드, 낮 시간대, 주변 카페·쇼핑몰 많음"

설명 문장만 출력하고 따옴표·마크다운은 쓰지 마세요.`;

async function resizeForVision(buf: Buffer): Promise<{
  buf: Buffer;
  mime: string;
}> {
  const sharp = (await import("sharp")).default;
  const out = await sharp(buf)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  return { buf: out, mime: "image/jpeg" };
}

export async function describeUserMediaPhoto(
  imageBuffer: Buffer,
  contentType: string,
): Promise<string> {
  const cfg = resolveChatLlm();
  if (!cfg) {
    return "AI 미설정: 매체 사진 설명을 생성할 수 없습니다.";
  }

  let buf = imageBuffer;
  let mime = contentType || "image/jpeg";
  try {
    const r = await resizeForVision(imageBuffer);
    buf = r.buf;
    mime = r.mime;
  } catch {
    /* 원본 사용 */
  }

  const visionModel =
    process.env.XAI_VISION_MODEL?.trim() || "grok-4";
  const b64 = buf.toString("base64");
  const dataUrl = `data:${mime};base64,${b64}`;

  async function callVision(c: ResolvedChatLlm): Promise<string> {
    return chatCompletions(c, {
      modelOverride: visionModel,
      temperature: 0.15,
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });
  }

  try {
    if (cfg.provider === "xai") {
      const text = await callVision(cfg);
      const t = text.trim().replace(/^["']|["']$/g, "").slice(0, 600);
      return t || "설명을 생성하지 못했습니다.";
    }
    if (cfg.provider === "openai") {
      const text = await chatCompletions(cfg, {
        modelOverride:
          process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.15,
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      });
      return text.trim().slice(0, 600) || "설명을 생성하지 못했습니다.";
    }
  } catch (e) {
    console.warn("[describe-user-media-photo]", e);
    return `이미지 설명 실패: ${e instanceof Error ? e.message.slice(0, 120) : "오류"}`;
  }

  return "xAI(Grok) Vision 또는 OpenAI Vision API가 필요합니다. XAI_API_KEY와 XAI_VISION_MODEL을 설정해 주세요.";
}
