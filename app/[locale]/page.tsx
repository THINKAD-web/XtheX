import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { CountUp } from "@/components/count-up";
import { Link } from "@/i18n/navigation";
import { FaqSection } from "@/components/FaqSection";
import { RealtimeMiniDashboardSection } from "@/components/campaign/RealtimeMiniDashboardSection";
import { LivePerformanceDashboardSection } from "@/components/campaign/LivePerformanceDashboardSection";
import { DashboardTabSection } from "@/components/home/DashboardTabSection";
import { SUCCESS_CASES } from "@/lib/case-studies/success-cases";
import { MediaMixSearchSection } from "@/components/mix-media/MediaMixSearchSection";
import { landing } from "@/lib/landing-theme";
import { HomeHeroDaypart } from "@/components/daypart/HomeHeroDaypart";
import { HomeSolidDaypartWrapper } from "@/components/daypart/HomeSolidDaypartWrapper";
import { HomeRoleCtas } from "@/components/home/home-role-ctas";
import { BetaNoticebar } from "@/components/home/BetaNoticebar";
import { PartnersSectionClient } from "@/components/home/PartnersSectionClient";
import { TestimonialsSectionClient } from "@/components/home/TestimonialsSectionClient";
import { FeaturesSectionClient } from "@/components/home/FeaturesSectionClient";
import { HowItWorksSectionClient } from "@/components/home/HowItWorksSectionClient";
import { CrossBorderCaseCard } from "@/components/home/CrossBorderCaseCard";

const LazyPulse = () => (
  <div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
);

const TrendingMediasSection = dynamic(
  () => import("@/components/medias/TrendingMediasSection").then((m) => ({ default: m.TrendingMediasSection })),
  { loading: LazyPulse },
);

const SuccessCaseGallery = dynamic(
  () => import("@/components/case-studies/SuccessCaseGallery").then((m) => ({ default: m.SuccessCaseGallery })),
  { loading: LazyPulse },
);

const StatsSection = dynamic(
  () => import("@/components/stats-section").then((m) => ({ default: m.StatsSection })),
  { loading: LazyPulse },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    ko: "XtheX - 글로벌 옥외광고 마켓플레이스",
    en: "XtheX - Global OOH Ad Marketplace",
    ja: "XtheX - グローバル屋外広告マーケットプレイス",
    zh: "XtheX - 全球户外广告平台",
  };
  const descs: Record<string, string> = {
    ko: "전세계 옥외광고를 AI로 연결 — 매체사 제안서 업로드부터 광고주 탐색, 매칭, 계약까지",
    en: "Connect global OOH ads with AI — from media proposals to advertiser matching and contracts",
    ja: "AIで世界中の屋外広告をつなぐ — 媒体提案から広告主マッチング・契約まで",
    zh: "用AI连接全球户外广告 — 从媒体提案到广告主匹配与合同",
  };
  const title = titles[locale] ?? titles.en;
  const description = descs[locale] ?? descs.en;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${locale}`,
      siteName: "XtheX",
    },
  };
}

async function Features() {
  const t = await getTranslations("home.features");
  const cards: [
    { title: string; desc: string },
    { title: string; desc: string },
    { title: string; desc: string },
    { title: string; desc: string },
  ] = [
    { title: t("ai_review_title"), desc: t("ai_review_desc") },
    { title: t("global_map_title"), desc: t("global_map_desc") },
    { title: t("fast_matching_title"), desc: t("fast_matching_desc") },
    { title: t("safe_contract_title"), desc: t("safe_contract_desc") },
  ];
  return (
    <FeaturesSectionClient
      sectionTitle={t("section_title")}
      sectionSubtitle={t("section_subtitle")}
      startCta={t("start_cta")}
      cards={cards}
    />
  );
}

async function HowItWorks() {
  const t = await getTranslations("home.howItWorks");
  const steps = [
    { num: 1, title: t("step1_title"), desc: t("step1_desc") },
    { num: 2, title: t("step2_title"), desc: t("step2_desc") },
    { num: 3, title: t("step3_title"), desc: t("step3_desc") },
    { num: 4, title: t("step4_title"), desc: t("step4_desc") },
    { num: 5, title: t("step5_title"), desc: t("step5_desc") },
  ];
  return (
    <HowItWorksSectionClient
      sectionTitle={t("section_title")}
      sectionSubtitle={t("section_subtitle")}
      signupCta={t("signup_cta")}
      steps={steps}
    />
  );
}

async function Partners() {
  const t = await getTranslations("home.partners");
  return (
    <PartnersSectionClient
      title={t("section_title")}
      subtitle={t("section_subtitle")}
    />
  );
}

async function Testimonials() {
  const t = await getTranslations("home.testimonials");
  const keys = [
    {
      quote: "item1_quote",
      name: "item1_name",
      role: "item1_role",
      company: "item1_company",
      avatar: "김",
      rating: 5,
    },
    {
      quote: "item2_quote",
      name: "item2_name",
      role: "item2_role",
      company: "item2_company",
      avatar: "이",
      rating: 5,
    },
    {
      quote: "item3_quote",
      name: "item3_name",
      role: "item3_role",
      company: "item3_company",
      avatar: "박",
      rating: 5,
    },
    {
      quote: "item4_quote",
      name: "item4_name",
      role: "item4_role",
      company: "item4_company",
      avatar: "최",
      rating: 5,
    },
  ] as const;
  const items = keys.map((row) => ({
    quote: t(row.quote),
    name: t(row.name),
    role: t(row.role),
    company: t(row.company),
    avatar: row.avatar,
    rating: row.rating,
  }));
  return (
    <TestimonialsSectionClient
      title={t("section_title")}
      subtitle={t("section_subtitle")}
      items={items}
    />
  );
}

async function CtaBanner() {
  const t = await getTranslations("home.cta");
  return (
    <section className="relative border-t border-blue-500/20 bg-gradient-to-br from-blue-600 via-blue-700 to-zinc-950 py-20 lg:py-28 dark:from-blue-950 dark:via-zinc-950 dark:to-zinc-950">
      <div className={`${landing.container} max-w-4xl text-center`}>
        <h2 className="text-balance text-3xl font-bold tracking-tight text-white lg:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-blue-100/95 lg:text-xl">
          {t("subtitle")}
        </p>
        <HomeRoleCtas
          mediaLabel={t("cta_partner")}
          advertiserLabel={t("cta_explore")}
          mediaClassName="inline-flex h-11 min-w-[200px] items-center justify-center rounded-lg bg-white px-8 text-sm font-semibold text-blue-700 shadow-xl transition-all duration-200 hover:brightness-105 hover:bg-blue-50 hover:shadow-2xl"
          advertiserClassName="inline-flex h-11 min-w-[200px] items-center justify-center rounded-lg border-2 border-white/90 bg-transparent px-8 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        />
      </div>
    </section>
  );
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <AppSiteChrome>
      <main>
        <HomeHeroDaypart />
        <BetaNoticebar />
        {/* 크로스보더 성공 사례 */}
        <section className="border-b border-zinc-100 bg-white py-10 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-zinc-400">
              {locale.startsWith("ko") ? "실제 진행 사례" : locale.startsWith("ja") ? "実績事例" : locale.startsWith("zh") ? "真实案例" : "Real Cases"}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <CrossBorderCaseCard
                tag={locale.startsWith("ko") ? "48시간" : locale.startsWith("ja") ? "48時間" : locale.startsWith("zh") ? "48小时" : "48hrs"}
                title={locale.startsWith("ko") ? "중국 대행사 → 시부야 빌보드 확정" : locale.startsWith("ja") ? "中国代理店 → 渋谷ビルボード確定" : locale.startsWith("zh") ? "中国代理商 → 确定涩谷广告牌" : "Chinese Agency → Shibuya Billboard"}
                description={locale.startsWith("ko") ? "인하우스 대행사가 일본 옥외광고 진행, AI 매칭으로 48시간 내 완료" : locale.startsWith("ja") ? "インハウス代理店がAIマッチングで48時間以内に日本OOH広告を完了" : locale.startsWith("zh") ? "内部代理商通过AI匹配在48小时内完成日本户外广告投放" : "In-house agency completed Japan OOH via AI matching in 48hrs"}
                fromCountry="🇨🇳"
                toCountry="🇯🇵"
              />
              <CrossBorderCaseCard
                tag={locale.startsWith("ko") ? "글로벌" : locale.startsWith("ja") ? "グローバル" : locale.startsWith("zh") ? "全球" : "Global"}
                title={locale.startsWith("ko") ? "일본 게임사 → 타임스스퀘어" : locale.startsWith("ja") ? "日本ゲーム会社 → タイムズスクエア" : locale.startsWith("zh") ? "日本游戏公司 → 时代广场" : "Japanese Game Co. → Times Square"}
                description={locale.startsWith("ko") ? "신작 출시 프로모션, 뉴욕 타임스스퀘어 대형 스크린 집행" : locale.startsWith("ja") ? "新作リリース、NYタイムズスクエアの大型スクリーンに掲載" : locale.startsWith("zh") ? "新游戏发布宣传，在纽约时代广场大屏幕投放" : "New game launch promo on NYC Times Square large screen"}
                fromCountry="🇯🇵"
                toCountry="🇺🇸"
              />
              <CrossBorderCaseCard
                tag={locale.startsWith("ko") ? "멀티시장" : locale.startsWith("ja") ? "マルチ市場" : locale.startsWith("zh") ? "多市场" : "Multi-market"}
                title={locale.startsWith("ko") ? "한국 브랜드 → 도쿄·상하이 동시" : locale.startsWith("ja") ? "韓国ブランド → 東京・上海同時展開" : locale.startsWith("zh") ? "韩国品牌 → 东京·上海同步投放" : "Korean Brand → Tokyo & Shanghai"}
                description={locale.startsWith("ko") ? "한 번의 요청으로 두 나라 동시 집행, 현지 계약 자동 처리" : locale.startsWith("ja") ? "1リクエストで2カ国同時掲載、現地契約を自動処理" : locale.startsWith("zh") ? "一次请求同时在两国投放，自动处理当地合同" : "Single request for 2-country campaign, auto local contract handling"}
                fromCountry="🇰🇷"
                toCountry="🇯🇵🇨🇳"
              />
            </div>
          </div>
        </section>
        <MediaMixSearchSection />
        <HomeSolidDaypartWrapper>
          <TrendingMediasSection locale={locale} />
          <DashboardTabSection
            locale={locale}
            realtimeSlot={<RealtimeMiniDashboardSection locale={locale} />}
            performanceSlot={<LivePerformanceDashboardSection locale={locale} />}
          />
          <SuccessCaseGallery
            locale={locale}
            cases={SUCCESS_CASES}
            applyHrefBase={`/${locale}/admin/medias`}
            titleKo="성공 사례 갤러리"
            titleEn="Success case gallery"
            subtitleKo="검증된 사례를 보고, 해당 타겟팅을 바로 적용해보세요."
            subtitleEn="Browse proven cases and apply targeting instantly."
            autoToneFromBrightness
          />
        </HomeSolidDaypartWrapper>
        <Features />
        <HowItWorks />
        <StatsSection />
        <Partners />
        <Testimonials />
        <CtaBanner />
        <div className="mx-auto max-w-4xl px-4">
          <hr className="border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <FaqSection />
      </main>
    </AppSiteChrome>
  );
}
