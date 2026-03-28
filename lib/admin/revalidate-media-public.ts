import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

/**
 * 승인/반려/게시 후 관리자 목록·탐색·매체사 대시보드 캐시를 갱신합니다.
 * @param mediaId 지정 시 해당 매체의 매체사 검토 페이지도 무효화합니다.
 */
export function revalidateMediaReviewSurfaces(mediaId?: string) {
  const paths = new Set<string>();
  paths.add("/admin/medias");
  paths.add("/admin/content-approval");
  paths.add("/explore");
  for (const locale of routing.locales) {
    paths.add(`/${locale}/admin/medias`);
    paths.add(`/${locale}/admin/content-approval`);
    paths.add(`/${locale}/explore`);
  }
  for (const p of paths) {
    revalidatePath(p);
  }

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/dashboard/media-owner`, "layout");
  }
  if (mediaId) {
    for (const locale of routing.locales) {
      revalidatePath(`/${locale}/dashboard/media-owner/medias/${mediaId}/review`);
    }
  }
}
