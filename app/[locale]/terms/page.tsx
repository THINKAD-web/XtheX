import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { landing } from "@/lib/landing-theme";

export const metadata: Metadata = {
  title: "Terms — XtheX",
};

export default async function TermsPage() {
  return (
    <AppSiteChrome>
      <main className={`${landing.container} py-12 sm:py-16 lg:py-20`}>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-foreground">
            이용약관
          </h1>
          <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">
            {`본 페이지는 데모용 안내입니다.\n실제 서비스 오픈 시 법무 검토된 약관으로 교체하세요.`}
          </p>
          <Link href="/" className="mt-6 inline-block text-primary hover:underline">
            ← 홈
          </Link>
        </div>
      </main>
    </AppSiteChrome>
  );
}
