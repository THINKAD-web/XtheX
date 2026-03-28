import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { HelpPageClient } from "@/components/help/HelpPageClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "help" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function HelpPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");

  return (
    <AppSiteChrome>
      <HelpPageClient />
    </AppSiteChrome>
  );
}
