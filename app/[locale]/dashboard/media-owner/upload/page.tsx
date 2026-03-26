import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { MediaOwnerRegistrationHub } from "@/components/dashboard/media-owner-registration-hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Upload Media | XtheX",
  description: "Register a new media listing for review and publication.",
  robots: { index: false, follow: false },
};

export default async function MediaOwnerUploadPage() {
  await gateMediaOwnerDashboard();
  const t = await getTranslations("dashboard.mediaOwner.upload");

  return (
    <main className={`${landing.container} py-10 lg:py-14`}>
      <MediaOwnerRegistrationHub
        backLabel={t("back")}
        backHref="/dashboard/media-owner"
        title={t("title")}
        subtitle={t("subtitle")}
      />
    </main>
  );
}
