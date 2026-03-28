import { setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import dynamic from "next/dynamic";
import { routing } from "@/i18n/routing";
import { defaultTimeZoneForLocale } from "@/lib/i18n/locale-config";
import { DocumentLang } from "@/components/i18n/DocumentLang";
import { ConditionalSiteFooter } from "@/components/layout/ConditionalSiteFooter";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { GuidedTourOverlayLazy } from "@/components/onboarding/GuidedTourOverlayLazy";
import { OmniCartShellLazy } from "@/components/omni/OmniCartShellLazy";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";

const ChatWidget = dynamic(
  () => import("@/components/chat/ChatWidget").then((m) => m.ChatWidget),
);

const FeedbackWidget = dynamic(
  () => import("@/components/feedback/FeedbackWidget").then((m) => m.FeedbackWidget),
);

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const timeZone = defaultTimeZoneForLocale(locale);
  return (
    <NextIntlClientProvider
      locale={locale as unknown as string}
      messages={messages as unknown as Record<string, unknown>}
      timeZone={timeZone}
    >
      <DocumentLang />
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <main className="flex-1">
          <OnboardingGate>
            <WelcomeModal />
            <GuidedTourOverlayLazy />
            <OmniCartShellLazy />
            <ChatWidget />
            <FeedbackWidget />
            {children}
          </OnboardingGate>
        </main>
        <ConditionalSiteFooter />
      </div>
    </NextIntlClientProvider>
  );
}
