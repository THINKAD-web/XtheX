import { redirect } from "next/navigation";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { getLocalizedPath } from "@/lib/auth/paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 레거시 `/recommend` → 권장 경로로 통일 */
export default async function RecommendRedirectPage() {
  await gateAdvertiserDashboard();
  redirect(await getLocalizedPath("/dashboard/advertiser/recommendations"));
}
