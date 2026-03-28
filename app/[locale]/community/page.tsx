import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { CommunityForumHome } from "@/components/community/CommunityForumHome";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "community" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
    openGraph: {
      title: t("meta_title"),
      description: t("meta_description"),
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default function CommunityPage() {
  return (
    <AppSiteChrome mainClassName="pb-16">
      <CommunityForumHome />
    </AppSiteChrome>
  );
}
