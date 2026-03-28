import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { landing } from "@/lib/landing-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnershipApplyForm } from "@/components/partnerships/PartnershipApplyForm";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partnerships.apply");
  return {
    title: `${t("meta_title")} | XtheX`,
    description: t("meta_description"),
  };
}

export default async function PartnershipApplyPage() {
  const t = await getTranslations("partnerships.apply");

  return (
    <AppSiteChrome>
      <main className={`${landing.container} py-12 sm:py-16 lg:py-20`}>
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
            <p className="text-muted-foreground">{t("lead")}</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t("form_title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("form_description")}</p>
            </CardHeader>
            <CardContent>
              <PartnershipApplyForm />
            </CardContent>
          </Card>
          <Link href="/contact" className="text-sm text-primary hover:underline">
            {t("back_contact")}
          </Link>
        </div>
      </main>
    </AppSiteChrome>
  );
}
