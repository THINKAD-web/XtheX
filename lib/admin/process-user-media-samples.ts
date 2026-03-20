import { describeUserMediaPhoto } from "@/lib/ai/describe-user-media-photo";
import {
  isUserMediaSamplesBucketConfigured,
  uploadUserMediaSampleImages,
} from "@/lib/storage/upload-user-media-samples";

export type UserMediaSamplesResult = {
  urls: string[];
  descriptions: string[];
  /** 업로드 실패했으나 Vision 설명만 있는 경우 본문에 붙임 */
  descriptionExtras: string;
  warnings: string[];
};

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;

function isImageFile(f: File): boolean {
  return /^image\//i.test(f.type) || /\.(jpe?g|png|webp|gif)$/i.test(f.name);
}

/**
 * 사용자 매체 사진: Supabase media-samples 업로드 + Grok Vision 설명 (각 장 순차).
 */
export async function processUserMediaSampleFiles(
  files: File[],
): Promise<UserMediaSamplesResult> {
  const warnings: string[] = [];
  const slice = files.slice(0, MAX_FILES);
  if (files.length > MAX_FILES) {
    warnings.push(
      `이미지는 최대 ${MAX_FILES}장까지 처리합니다. 나머지 ${files.length - MAX_FILES}장은 제외되었습니다.`,
    );
  }

  const urls: string[] = [];
  const descriptions: string[] = [];
  const extras: string[] = [];

  const folder = `user/${Date.now()}`;
  const hasBucket = isUserMediaSamplesBucketConfigured();
  if (!hasBucket) {
    warnings.push(
      "Supabase(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) 미설정 시 이미지 URL이 저장되지 않습니다. 버킷: media-samples",
    );
  }

  for (let i = 0; i < slice.length; i++) {
    const f = slice[i];
    if (!isImageFile(f)) {
      warnings.push(`${f.name}: 이미지 파일만 가능합니다.`);
      continue;
    }
    if (f.size > MAX_BYTES) {
      warnings.push(`${f.name}: 10MB 이하만 가능합니다.`);
      continue;
    }

    const buf = Buffer.from(await f.arrayBuffer());
    const mime = f.type || "image/jpeg";

    let publicUrl = "";
    if (hasBucket) {
      const uploaded = await uploadUserMediaSampleImages(
        [{ buffer: buf, contentType: mime, name: `img${i}` }],
        folder,
      );
      publicUrl = uploaded[0] ?? "";
      if (!publicUrl) {
        warnings.push(`${f.name}: Storage 업로드 실패`);
      }
    }

    const desc = await describeUserMediaPhoto(buf, mime);

    if (publicUrl) {
      urls.push(publicUrl);
      descriptions.push(desc);
    } else {
      extras.push(`[업로드 사진 ${extras.length + urls.length + 1}] ${desc}`);
    }
  }

  return {
    urls,
    descriptions,
    descriptionExtras: extras.join("\n"),
    warnings,
  };
}
