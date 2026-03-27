import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { landing } from "@/lib/landing-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Terms — XtheX",
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isKo = locale === "ko";
  return (
    <AppSiteChrome>
      <main className={`${landing.container} py-12 sm:py-16 lg:py-20`}>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-3">
            <Badge className="bg-zinc-800 text-zinc-100 dark:bg-zinc-700">MVP</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {isKo ? "서비스 이용약관 (요약)" : "Terms of Service (Summary)"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isKo
                ? "정식 서비스 전 MVP 운영을 위한 임시 약관입니다. 정식 출시 시 법무 검토본으로 교체됩니다."
                : "Temporary terms for MVP operation. A legal-reviewed version will replace this before full launch."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isKo ? "서비스 범위" : "Service scope"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{isKo ? "- 옥외광고 매체 탐색 및 추천" : "- OOH media discovery and recommendations"}</p>
                <p>{isKo ? "- 매체 등록 및 검토/승인" : "- Media registration and review/approval"}</p>
                <p>{isKo ? "- 캠페인 초안 생성" : "- Campaign draft creation"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isKo ? "책임 제한" : "Limitation of liability"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{isKo ? "- MVP 단계 데이터는 사전 고지 없이 변경될 수 있습니다." : "- MVP data may change without notice."}</p>
                <p>{isKo ? "- 외부 결제/계약은 별도 합의에 따릅니다." : "- External payment and contract terms follow separate agreements."}</p>
                <p>{isKo ? "- 서비스 중단 시 사전 공지 후 조치합니다." : "- We notify users in advance when possible for planned downtime."}</p>
              </CardContent>
            </Card>
          </div>

          <Link href="/" className="inline-block text-primary hover:underline">
            ← {isKo ? "홈" : "Home"}
          </Link>
        </div>
      </main>
    </AppSiteChrome>
  );
}
