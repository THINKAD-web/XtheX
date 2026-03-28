import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { DevelopersHubClient } from "@/components/developers/DevelopersHubClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "developers" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function DevelopersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AppSiteChrome>
      <DevelopersHubClient />
    </AppSiteChrome>
  );
}
