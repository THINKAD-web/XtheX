import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CountUp } from "@/components/count-up";
import { StatsSection } from "@/components/stats-section";
import { Link } from "@/i18n/navigation";
import { FaqSection } from "@/components/FaqSection";
import { TrendingMediasSection } from "@/components/medias/TrendingMediasSection";
import { RealtimeMiniDashboardSection } from "@/components/campaign/RealtimeMiniDashboardSection";
import { LivePerformanceDashboardSection } from "@/components/campaign/LivePerformanceDashboardSection";
import { SUCCESS_CASES } from "@/lib/case-studies/success-cases";
import { SuccessCaseGallery } from "@/components/case-studies/SuccessCaseGallery";
import { MediaMixSearchSection } from "@/components/mix-media/MediaMixSearchSection";
import { landing } from "@/lib/landing-theme";
import { HomeHeroDaypart } from "@/components/daypart/HomeHeroDaypart";
import { HomeSolidDaypartWrapper } from "@/components/daypart/HomeSolidDaypartWrapper";
import { HomeRoleCtas } from "@/components/home/home-role-ctas";
import { PartnersSectionClient } from "@/components/home/PartnersSectionClient";
import { TestimonialsSectionClient } from "@/components/home/TestimonialsSectionClient";
import { FeaturesSectionClient } from "@/components/home/FeaturesSectionClient";
import { HowItWorksSectionClient } from "@/components/home/HowItWorksSectionClient";

export const metadata: Metadata = {
  title: "XtheX - Global Outdoor Ad Marketplace",
  description:
    "전세계 옥외광고 매체를 AI로 연결하는 플랫폼. 매체사 제안서 업로드부터 광고주 탐색, 매칭, 계약까지 한 곳에서.",
  openGraph: {
    title: "XtheX - Global Outdoor Ad Marketplace",
    description:
      "전세계 옥외광고 매체를 AI로 연결하는 플랫폼. 매체사 제안서 업로드부터 광고주 탐색, 매칭, 계약까지 한 곳에서.",
    url: "/",
    siteName: "XtheX",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "XtheX - Global Outdoor Ad Marketplace",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "XtheX - Global Outdoor Ad Marketplace",
    description:
      "전세계 옥외광고 매체를 AI로 연결하는 플랫폼. 매체사 제안서 업로드부터 광고주 탐색, 매칭, 계약까지 한 곳에서.",
    images: ["/og-image.png"],
  },
};

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
          mediaSignedInHref="/dashboard/media-owner"
          advertiserSignedInHref="/explore"
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
    <>
      <SiteHeader />
      <main>
        <HomeHeroDaypart />
        <MediaMixSearchSection />
        <HomeSolidDaypartWrapper>
          <TrendingMediasSection locale={locale} />
          <RealtimeMiniDashboardSection locale={locale} />
          <LivePerformanceDashboardSection locale={locale} />
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
        <FaqSection />
      </main>
    </>
  );
}
