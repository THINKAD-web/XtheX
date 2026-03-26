import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { getLocalizedPath } from "@/lib/auth/paths";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Legacy path redirect to recommendations page. */
export default async function AdvertiserRecommendRedirectPage() {
  await gateAdvertiserDashboard();
  redirect(await getLocalizedPath("/dashboard/advertiser/recommendations"));
}
