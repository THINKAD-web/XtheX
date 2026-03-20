import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
import { CountUp } from "@/components/count-up";
import { StatsSection } from "@/components/stats-section";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  Shield,
  Globe,
  Zap,
  Lock,
  Upload,
  Bot,
  Map,
  Link2,
  FileCheck,
  Star,
} from "lucide-react";
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

async function Navbar() {
  const t = await getTranslations("nav");
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          XtheX
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" className="h-11 rounded-lg px-4">
                {t("sign_in")}
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="h-11 rounded-lg px-6 font-medium">
                {t("sign_up")}
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}

async function Features() {
  const t = await getTranslations("home.features");
  const items = [
    { icon: Shield, titleKey: "ai_review_title" as const, descKey: "ai_review_desc" as const },
    { icon: Globe, titleKey: "global_map_title" as const, descKey: "global_map_desc" as const },
    { icon: Zap, titleKey: "fast_matching_title" as const, descKey: "fast_matching_desc" as const },
    { icon: Lock, titleKey: "safe_contract_title" as const, descKey: "safe_contract_desc" as const },
  ];
  return (
    <section
      className={`${landing.sectionAlt} bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900/40`}
    >
      <div className={landing.container}>
        <h2 className={landing.h2}>{t("section_title")}</h2>
        <p className={landing.lead}>{t("section_subtitle")}</p>
        <div className={landing.grid4}>
          {items.map(({ icon: Icon, titleKey, descKey }) => (
            <div key={titleKey} className={`${landing.card} flex flex-col`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t(titleKey)}
              </h3>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-base">
                {t(descKey)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-14 flex justify-center">
          <Link href="/explore" className={landing.btnPrimaryMuted}>
            {t("start_cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}

async function HowItWorks() {
  const t = await getTranslations("home.howItWorks");
  const steps = [
    { num: 1, icon: Upload, titleKey: "step1_title" as const, descKey: "step1_desc" as const },
    { num: 2, icon: Bot, titleKey: "step2_title" as const, descKey: "step2_desc" as const },
    { num: 3, icon: Map, titleKey: "step3_title" as const, descKey: "step3_desc" as const },
    { num: 4, icon: Link2, titleKey: "step4_title" as const, descKey: "step4_desc" as const },
    { num: 5, icon: FileCheck, titleKey: "step5_title" as const, descKey: "step5_desc" as const },
  ];
  return (
    <section className={`${landing.section} bg-white dark:bg-zinc-950`}>
      <div className={`${landing.container} max-w-4xl`}>
        <h2 className={landing.h2}>{t("section_title")}</h2>
        <p className={landing.lead}>{t("section_subtitle")}</p>

        <div className="mt-12 space-y-6 lg:mt-16 lg:space-y-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className={`${landing.card} flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8`}
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-50 text-sm font-bold text-blue-600 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-400">
                  {step.num}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {t(step.titleKey)}
                    </h3>
                  </div>
                  <p className="mt-3 text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-lg">
                    {t(step.descKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 flex justify-center">
          <Link href="/sign-up" className={landing.btnPrimaryMuted}>
            {t("signup_cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}

const PARTNERS: { name: string; slug: string; logo: string }[] = [
  { name: "JCDecaux", slug: "jcdecaux", logo: "/logos/jcdecaux.svg" },
  { name: "Clear Channel", slug: "clear-channel", logo: "/logos/clear-channel.svg" },
  { name: "Lamar", slug: "lamar", logo: "/logos/lamar.svg" },
  { name: "OUTFRONT", slug: "outfront", logo: "/logos/outfront.svg" },
  { name: "Stroer", slug: "stroer", logo: "/logos/stroer.svg" },
  { name: "Global", slug: "global", logo: "/logos/global.svg" },
  { name: "Primesight", slug: "primesight", logo: "/logos/primesight.svg" },
  { name: "Ocean Outdoor", slug: "ocean-outdoor", logo: "/logos/ocean-outdoor.svg" },
];

async function Partners() {
  const t = await getTranslations("home.partners");
  return (
    <section className={`${landing.sectionAlt} bg-white/90 dark:bg-zinc-950/90`}>
      <div className={landing.container}>
        <h2 className={landing.h2}>{t("section_title")}</h2>
        <p className={landing.lead}>{t("section_subtitle")}</p>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:mt-16 lg:grid-cols-6 lg:gap-6">
          {PARTNERS.map(({ name, logo }, index) => (
            <div
              key={name}
              className={`${landing.cardDarkCompact} flex min-h-[104px] items-center justify-center px-4 py-8 opacity-90 hover:opacity-100`}
            >
              <Image
                src={logo}
                alt={name}
                width={140}
                height={52}
                className="max-h-12 w-auto object-contain opacity-90 transition-opacity hover:opacity-100 dark:opacity-80 dark:hover:opacity-100"
                priority={index < 4}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({
  t,
}: {
  t: (key: string) => string;
}) {
  const items = [
    { quote: "item1_quote", name: "item1_name", role: "item1_role", company: "item1_company", avatar: "김", rating: 5 },
    { quote: "item2_quote", name: "item2_name", role: "item2_role", company: "item2_company", avatar: "이", rating: 5 },
    { quote: "item3_quote", name: "item3_name", role: "item3_role", company: "item3_company", avatar: "박", rating: 5 },
    { quote: "item4_quote", name: "item4_name", role: "item4_role", company: "item4_company", avatar: "최", rating: 5 },
  ];
  return (
    <section
      className={`${landing.sectionAlt} bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900/50`}
    >
      <div className={landing.container}>
        <h2 className={landing.h2}>{t("section_title")}</h2>
        <p className={landing.lead}>{t("section_subtitle")}</p>
        <div className={landing.grid3}>
          {items.map(({ quote, name, role, company, avatar, rating }) => (
            <div key={quote} className={`${landing.card} flex flex-col gap-4`}>
              <div className="flex items-center gap-1 text-blue-400 dark:text-blue-400">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-lg">
                &ldquo;{t(quote)}&rdquo;
              </p>
              <div className="mt-auto flex items-center gap-3 border-t border-zinc-200/80 pt-4 dark:border-zinc-700/60">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {t(name)}
                    {t(role) ? ` ${t(role)}` : ""}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t(company)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
        <div className="mt-12 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/dashboard/partner"
            className="inline-flex h-11 min-w-[200px] items-center justify-center rounded-lg bg-white px-8 text-sm font-semibold text-blue-700 shadow-xl transition-all duration-200 hover:brightness-105 hover:bg-blue-50 hover:shadow-2xl"
          >
            {t("cta_partner")}
          </Link>
          <Link
            href="/explore"
            className="inline-flex h-11 min-w-[200px] items-center justify-center rounded-lg border-2 border-white/90 bg-transparent px-8 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            {t("cta_explore")}
          </Link>
        </div>
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
  const tTestimonials = await getTranslations("home.testimonials");
  return (
    <>
      <Navbar />
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
          />
        </HomeSolidDaypartWrapper>
        <Features />
        <HowItWorks />
        <StatsSection />
        <Partners />
        <Testimonials t={tTestimonials} />
        <CtaBanner />
        <FaqSection />
      </main>
    </>
  );
}
