/**
 * Supabase Storage — 제안서 PDF에서 뽑은 샘플 페이지 이미지 업로드.
 * 환경변수 없으면 빈 배열 반환 (로컬/스테이징에서 선택).
 *
 * 필요: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 선택: SUPABASE_PROPOSAL_SAMPLES_BUCKET (기본 proposal-samples)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function isSupabaseUploadConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export type ProposalSampleUpload = {
  buffer: Buffer;
  contentType: string;
  /** 파일명 일부 (확장자 제외) */
  name: string;
};

/**
 * 공개 URL 목록 반환. 실패 시 로그만 하고 가능한 만큼만 반환.
 */
export async function uploadProposalSampleImages(
  uploads: ProposalSampleUpload[],
  folderPrefix: string,
): Promise<string[]> {
  const supabase = getClient();
  const bucket =
    process.env.SUPABASE_PROPOSAL_SAMPLES_BUCKET?.trim() ||
    "proposal-samples";
  if (!supabase || uploads.length === 0) {
    if (uploads.length > 0 && !supabase) {
      console.warn(
        "[supabase-upload] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 없음 → 샘플 이미지 업로드 생략",
      );
    }
    return [];
  }

  const safeFolder = folderPrefix.replace(/[^a-zA-Z0-9/_-]/g, "_").slice(0, 120);
  const urls: string[] = [];

  for (let i = 0; i < uploads.length; i++) {
    const u = uploads[i];
    const ext = u.contentType.includes("png") ? "png" : "jpg";
    const path = `${safeFolder}/${Date.now()}_${i}_${u.name}.${ext}`.replace(
      /\/+/g,
      "/",
    );
    try {
      const { error } = await supabase.storage.from(bucket).upload(path, u.buffer, {
        contentType: u.contentType,
        upsert: true,
      });
      if (error) {
        console.warn("[supabase-upload]", path, error.message);
        continue;
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      if (urlData?.publicUrl) urls.push(urlData.publicUrl);
    } catch (e) {
      console.warn("[supabase-upload]", e);
    }
  }
  if (urls.length > 0) {
    console.log(`[supabase-upload] ${urls.length}개 업로드 완료 →`, bucket);
  }
  return urls;
}
