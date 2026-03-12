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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Monitor,
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
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          XtheX
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                {t("sign_in")}
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">{t("sign_up")}</Button>
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

async function Hero() {
  const t = await getTranslations("home.hero");
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4 py-24 text-white">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 50%, rgba(0,0,0,0.3) 100%),
            linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px),
            linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px, 60px 60px, 60px 60px",
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        {[
          { top: "12%", left: "8%", size: 24, opacity: 0.4 },
          { top: "18%", right: "15%", size: 20, opacity: 0.35 },
          { top: "45%", left: "12%", size: 28, opacity: 0.3 },
          { top: "70%", left: "20%", size: 22, opacity: 0.4 },
          { top: "25%", right: "25%", size: 18, opacity: 0.35 },
          { top: "60%", right: "10%", size: 26, opacity: 0.3 },
          { top: "80%", right: "22%", size: 20, opacity: 0.4 },
          { top: "35%", left: "5%", size: 16, opacity: 0.35 },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute text-blue-400/60"
            style={{
              top: pos.top,
              left: (pos as { left?: string }).left,
              right: (pos as { right?: string }).right,
              width: pos.size,
              height: pos.size,
              opacity: pos.opacity,
            }}
          >
            <Monitor className="h-full w-full" />
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-lg text-zinc-300 sm:text-xl">
          {t("subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/dashboard/partner"
            className="inline-flex h-11 min-w-[200px] items-center justify-center rounded-md bg-blue-600 px-6 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {t("cta_partner")}
          </Link>
          <Link
            href="/explore"
            className="inline-flex h-11 min-w-[200px] items-center justify-center rounded-md border border-zinc-500 bg-transparent px-6 text-sm font-medium text-white transition-colors hover:bg-white/10 dark:border-zinc-400"
          >
            {t("cta_explore")}
          </Link>
        </div>
      </div>
    </section>
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
    <section className="relative border-t border-zinc-200 bg-gradient-to-b from-zinc-50 to-white py-20 dark:border-zinc-800 dark:from-zinc-900/50 dark:to-zinc-950">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {t("section_title")}
        </h2>
        <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
          {t("section_subtitle")}
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, titleKey, descKey }) => (
            <Card
              key={titleKey}
              className="transition-shadow hover:shadow-md dark:border-zinc-800"
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4">{t(titleKey)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t(descKey)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Link
            href="/explore"
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
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
    <section className="relative border-t border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {t("section_title")}
        </h2>
        <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
          {t("section_subtitle")}
        </p>

        <div className="mt-14 space-y-8 sm:space-y-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-50 text-sm font-bold text-blue-600 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-400">
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {t(step.titleKey)}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {t(step.descKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 flex justify-center">
          <Link
            href="/sign-up"
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
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
    <section className="relative border-t border-zinc-200 bg-white/80 py-16 dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          {t("section_title")}
        </h2>
        <p className="mt-1 text-center text-zinc-600 dark:text-zinc-400">
          {t("section_subtitle")}
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {PARTNERS.map(({ name, logo }, index) => (
            <div
              key={name}
              className="flex min-h-[88px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-5 transition-all duration-200 hover:scale-105 hover:border-zinc-300 hover:bg-zinc-100 hover:brightness-110 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <Image
                src={logo}
                alt={name}
                width={160}
                height={60}
                className="object-contain"
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
    <section className="relative border-t border-zinc-200 bg-gradient-to-b from-zinc-50 to-white py-20 dark:border-zinc-800 dark:from-zinc-900/50 dark:to-zinc-950">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {t("section_title")}
        </h2>
        <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
          {t("section_subtitle")}
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map(({ quote, name, role, company, avatar, rating }) => (
            <Card
              key={quote}
              className="flex flex-col border-zinc-200 dark:border-zinc-800"
            >
              <CardContent className="flex flex-col gap-4 pt-6 pb-6">
                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  &ldquo;{t(quote)}&rdquo;
                </p>
                <div className="mt-auto flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {t(name)}
                      {t(role) ? ` ${t(role)}` : ""}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t(company)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

async function CtaBanner() {
  const t = await getTranslations("home.cta");
  return (
    <section className="relative border-t border-blue-200 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-20 dark:border-blue-900/50 dark:from-blue-900 dark:via-blue-950 dark:to-zinc-900">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-4 text-lg text-blue-100 dark:text-blue-200">
          {t("subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/dashboard/partner"
            className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-lg bg-white px-8 text-base font-semibold text-blue-700 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl dark:bg-white dark:text-blue-800 dark:hover:bg-blue-100"
          >
            {t("cta_partner")}
          </Link>
          <Link
            href="/explore"
            className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-lg border-2 border-white bg-transparent px-8 text-base font-semibold text-white transition-all hover:bg-white/15 dark:border-blue-200 dark:hover:bg-white/10"
          >
            {t("cta_explore")}
          </Link>
        </div>
      </div>
    </section>
  );
}

async function Footer() {
  const t = await getTranslations("home.footer");
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("copyright", { year })}
        </p>
        <nav className="flex gap-6 text-sm">
          <Link
            href="/about"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {t("about")}
          </Link>
          <Link
            href="/contact"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {t("contact")}
          </Link>
          <Link
            href="/terms"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {t("terms")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default async function Home() {
  const tTestimonials = await getTranslations("home.testimonials");
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <StatsSection />
        <Partners />
        <Testimonials t={tTestimonials} />
        <CtaBanner />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
