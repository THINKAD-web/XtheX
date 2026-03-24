import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { landing } from "@/lib/landing-theme";

export const metadata: Metadata = {
  title: "Contact — XtheX",
};

export default async function ContactPage() {
  const t = await getTranslations("nav");

  return (
    <AppSiteChrome>
      <main className={`${landing.container} py-12 sm:py-16 lg:py-20`}>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-foreground">
            Contact
          </h1>
          <p className="mt-4 text-muted-foreground">
            문의는 이메일 또는 관리자를 통해 연락 주세요. (데모 페이지)
          </p>
          <Link
            href="/explore"
            className="mt-6 inline-block text-primary hover:underline"
          >
            ← {t("explore")}
          </Link>
        </div>
      </main>
    </AppSiteChrome>
  );
}
