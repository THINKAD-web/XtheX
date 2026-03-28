import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { landing } from "@/lib/landing-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Contact — XtheX",
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("nav");
  const tc = await getTranslations("contact");
  const isKo = locale === "ko";

  return (
    <AppSiteChrome>
      <main className={`${landing.container} py-12 sm:py-16 lg:py-20`}>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-3">
            <Badge className="bg-blue-600 text-white">Early Access</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Contact</h1>
            <p className="text-muted-foreground">
              {isKo
                ? "서비스 도입, 매체 등록, 파트너십 문의를 빠르게 도와드립니다."
                : "We are here to help with onboarding, media registration, and partnerships."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>hello@xthex.com</p>
                <p>{isKo ? "평일 10:00 - 19:00 (KST)" : "Mon-Fri 10:00-19:00 (KST)"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isKo ? "문의 유형" : "Inquiry types"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{isKo ? "광고 집행 문의" : "Campaign inquiry"}</p>
                <p>{isKo ? "매체 등록/승인 문의" : "Media onboarding & approval"}</p>
                <p>{isKo ? "제휴 및 파트너십" : "Partnership requests"}</p>
                <Link
                  href="/partnerships/apply"
                  className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground ring-offset-background transition-colors hover:bg-secondary/80"
                >
                  {tc("partnership_cta")}
                </Link>
              </CardContent>
            </Card>
          </div>

          <Link href="/explore" className="inline-block text-primary hover:underline">
            ← {t("explore")}
          </Link>
        </div>
      </main>
    </AppSiteChrome>
  );
}
