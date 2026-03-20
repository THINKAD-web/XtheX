/**
 * 관리자 AI 업로드 — 사용자가 직접 올린 매체 사진 → Supabase `media-samples`.
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

export function isUserMediaSamplesBucketConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export type UserMediaSampleUpload = {
  buffer: Buffer;
  contentType: string;
  name: string;
};

export async function uploadUserMediaSampleImages(
  uploads: UserMediaSampleUpload[],
  folderPrefix: string,
): Promise<string[]> {
  const supabase = getClient();
  const bucket =
    process.env.SUPABASE_MEDIA_SAMPLES_BUCKET?.trim() || "media-samples";
  if (!supabase || uploads.length === 0) return [];

  const safeFolder = folderPrefix
    .replace(/[^a-zA-Z0-9/_-]/g, "_")
    .slice(0, 120);
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
        console.warn("[media-samples]", path, error.message);
        continue;
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      if (urlData?.publicUrl) urls.push(urlData.publicUrl);
    } catch (e) {
      console.warn("[media-samples]", e);
    }
  }
  if (urls.length > 0) {
    console.log(`[media-samples] ${urls.length}개 업로드 → ${bucket}`);
  }
  return urls;
}
