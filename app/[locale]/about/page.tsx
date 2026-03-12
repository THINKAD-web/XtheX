import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { StatsSectionItem } from "@/components/stats-section";
import { StatsSection } from "@/components/stats-section";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import {
  AlertTriangle,
  CheckCircle,
  Globe,
  Link2,
  Map,
  Sparkles,
  Star,
  Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About XtheX - Global Outdoor Ad Marketplace",
  description:
    "XtheX는 전세계 옥외광고를 AI로 연결하는 글로벌 플랫폼입니다. 비전, 미션, 그리고 우리가 해결하는 문제를 소개합니다.",
  openGraph: {
    title: "About XtheX - Global Outdoor Ad Marketplace",
    description:
      "전세계 옥외광고를 AI로 연결하는 글로벌 플랫폼. 매체사와 광고주를 한 곳에서 연결합니다.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About XtheX - Global Outdoor Ad Marketplace",
    description: "전세계 옥외광고를 AI로 연결하는 글로벌 플랫폼.",
  },
};

async function AboutNav() {
  const t = await getTranslations("about");
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          XtheX
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {t("nav_home")}
            </Link>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {t("nav_about")}
            </span>
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

async function AboutHero() {
  const t = await getTranslations("about");
  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-zinc-100 to-white py-24 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
      <div
        className="absolute inset-0 opacity-40 dark:opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px),
            linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          {t("hero_title")}
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          {t("hero_subtitle")}
        </p>
        <p className="mt-6 text-xl leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-2xl">
          {t("hero_tagline")}
        </p>
        <div className="mt-8 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <Map className="h-6 w-6" />
          </div>
        </div>
      </div>
    </section>
  );
}

async function AboutVision() {
  const t = await getTranslations("about");
  const missionItems = [t("mission_item_1"), t("mission_item_2"), t("mission_item_3")];
  return (
    <section className="border-b border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {t("vision_title")}
        </h2>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          {t("vision_subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex flex-shrink-0 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <Globe className="h-7 w-7" />
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
              <Sparkles className="h-7 w-7" />
            </div>
          </div>
          <p className="max-w-2xl text-left text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-center">
            {t("vision_paragraph")}
          </p>
        </div>

        <div className="mt-16 border-t border-zinc-200 pt-14 dark:border-zinc-800">
          <div className="flex items-center justify-center gap-2">
            <Target className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {t("mission_title")}
            </h3>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t("mission_subtitle")}
          </p>
          <ul className="mt-8 space-y-4 text-left sm:mx-auto sm:max-w-xl sm:space-y-5">
            {missionItems.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300"
              >
                <span className="mt-1.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <Link2 className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                </span>
                <span className="text-base leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

async function AboutProblemSolution() {
  const t = await getTranslations("about");
  const items = [
    { problem: "problem1", solution: "solution1" },
    { problem: "problem2", solution: "solution2" },
    { problem: "problem3", solution: "solution3" },
    { problem: "problem4", solution: "solution4" },
  ];
  return (
    <section className="border-b border-zinc-200 bg-zinc-50/80 py-20 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {t("problems_title")}
        </h2>
        <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
          {t("problems_subtitle")}
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {items.map(({ problem, solution }, index) => (
            <Card
              key={index}
              className="border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <CardContent className="pt-6 pb-6">
                <div className="flex gap-4">
                  <div className="flex flex-shrink-0 flex-col items-start gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
                      {t("problem_label")}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-snug text-zinc-800 dark:text-zinc-200">
                    {t(problem)}
                  </p>
                </div>
                <div className="mt-4 flex gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <div className="flex flex-shrink-0 flex-col items-start gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      {t("solution_label")}
                    </span>
                  </div>
                  <p className="text-sm leading-snug text-zinc-700 dark:text-zinc-300">
                    {t(solution)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


async function AboutTestimonials() {
  const t = await getTranslations("about");
  const items = [
    { quote: "testimonial1_quote", name: "testimonial1_name", role: "testimonial1_role", company: "testimonial1_company", avatar: "김" },
    { quote: "testimonial2_quote", name: "testimonial2_name", role: "testimonial2_role", company: "testimonial2_company", avatar: "이" },
    { quote: "testimonial3_quote", name: "testimonial3_name", role: "testimonial3_role", company: "testimonial3_company", avatar: "박" },
    { quote: "testimonial4_quote", name: "testimonial4_name", role: "testimonial4_role", company: "testimonial4_company", avatar: "최" },
  ];
  return (
    <section className="relative border-t border-zinc-200 bg-gradient-to-b from-white to-zinc-50/80 py-20 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900/80">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {t("testimonials_title")}
        </h2>
        <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
          {t("testimonials_subtitle")}
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ quote, name, role, company, avatar }) => (
            <Card
              key={quote}
              className="flex flex-col border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <CardContent className="flex flex-col gap-4 pt-6 pb-6">
                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
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
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {t(name)}
                      {t(role) || t(company)
                        ? ` · ${[t(role), t(company)].filter(Boolean).join(" · ")}`
                        : ""}
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

async function AboutFAQ() {
  const t = await getTranslations("about");
  const faqItems = [
    { q: "faq_q1", a: "faq_a1" },
    { q: "faq_q2", a: "faq_a2" },
    { q: "faq_q3", a: "faq_a3" },
    { q: "faq_q4", a: "faq_a4" },
    { q: "faq_q5", a: "faq_a5" },
    { q: "faq_q6", a: "faq_a6" },
  ];
  return (
    <section className="relative border-t border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {t("faq_title")}
        </h2>
        <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
          {t("faq_subtitle")}
        </p>
        <Accordion type="single" collapsible className="mt-10">
          {faqItems.map(({ q, a }, index) => (
            <AccordionItem key={index} value={`about-faq-${index}`}>
              <AccordionTrigger>{t(q)}</AccordionTrigger>
              <AccordionContent>{t(a)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

async function AboutCta() {
  const t = await getTranslations("about");
  return (
    <section className="border-b border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("cta_title")}
        </h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/explore"
            className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t("cta_explore")}
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-6 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            {t("cta_signup")}
          </Link>
        </div>
      </div>
    </section>
  );
}

async function AboutFooter() {
  const t = await getTranslations("about");
  return (
    <footer className="bg-zinc-50 py-6 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl justify-center px-4">
        <Link
          href="/"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {t("footer_back")}
        </Link>
      </div>
    </footer>
  );
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const aboutStatsItems: StatsSectionItem[] = [
    { end: 1500, suffix: "+", duration: 3, label: t("stats_label1") },
    { end: 98, suffix: "%", duration: 3, label: t("stats_label2") },
    { end: 60, suffix: "", duration: 3, label: t("stats_label3") },
    { end: 15000, suffix: "+", duration: 3, label: t("stats_label4") },
  ];
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <AboutNav />
      <main>
        <AboutHero />
        <AboutVision />
        <AboutProblemSolution />
        <StatsSection
          title={t("stats_title")}
          subtitle={t("stats_subtitle")}
          variant="calm"
          items={aboutStatsItems}
          ease={[0.33, 1, 0.68, 1]}
        />
        <AboutTestimonials />
        <AboutFAQ />
        <AboutCta />
      </main>
      <AboutFooter />
    </div>
  );
}
