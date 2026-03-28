import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";

const BillingManagementClient = dynamic(() =>
  import("@/components/billing/BillingManagementClient").then((m) => m.BillingManagementClient),
);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing");
  return {
    title: t("meta_title"),
    description: t("meta_description"),
    robots: { index: false, follow: false },
  };
}

export default function BillingPage() {
  return (
    <AppSiteChrome>
      <BillingManagementClient />
    </AppSiteChrome>
  );
}
