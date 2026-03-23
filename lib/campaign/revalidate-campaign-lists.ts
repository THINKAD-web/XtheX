import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

/** 캠페인 목록이 있는 페이지 캐시 무효화 (로케일별). */
export function revalidateCampaignListPages() {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) {
      revalidatePath("/dashboard/campaigns", "page");
      revalidatePath("/advertiser", "page");
    } else {
      revalidatePath(`/${locale}/dashboard/campaigns`, "page");
      revalidatePath(`/${locale}/advertiser`, "page");
    }
  }
}
