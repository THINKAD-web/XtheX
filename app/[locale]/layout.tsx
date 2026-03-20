import { setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ConditionalSiteFooter } from "@/components/layout/ConditionalSiteFooter";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { OmniCartShell } from "@/components/omni/OmniCartShell";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      locale={locale as unknown as string}
      messages={messages as unknown as Record<string, unknown>}
    >
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <main className="flex-1">
          <OnboardingGate>
            <OmniCartShell />
            {children}
          </OnboardingGate>
        </main>
        <ConditionalSiteFooter />
      </div>
    </NextIntlClientProvider>
  );
}
