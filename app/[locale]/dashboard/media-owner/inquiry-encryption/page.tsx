import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { InquiryE2eSetupClient } from "@/components/media-owner/InquiryE2eSetupClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "encryption" });
  return {
    title: t("meta_title"),
    robots: { index: false, follow: false },
  };
}

export default async function InquiryEncryptionPage() {
  await gateMediaOwnerDashboard();
  return (
    <div className={`${landing.container} py-10 lg:py-14`}>
      <InquiryE2eSetupClient />
    </div>
  );
}
