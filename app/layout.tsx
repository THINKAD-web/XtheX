import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { ToastProvider } from "@/components/ui/use-toast";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import { BrightnessProvider } from "@/components/brightness/BrightnessPreference";
import { BrightnessThemeBridge } from "@/components/brightness/BrightnessThemeBridge";
import { NavigationProgress } from "@/components/navigation-progress";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = (() => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) return appUrl;
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`;
  return "https://xthex.com";
})();

export const metadata: Metadata = {
  title: {
    default: "XtheX - Global Outdoor Ad Marketplace",
    template: "%s | XtheX",
  },
  description:
    "XtheX is a global outdoor advertising marketplace where partners upload media proposals and brands discover, match, and contract with AI.",
  applicationName: "XtheX",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "XtheX - Global Outdoor Ad Marketplace",
    description:
      "Discover and match outdoor advertising media worldwide. Partners upload proposals, AI reviews, admins approve, and brands explore on a map.",
    type: "website",
    siteName: "XtheX",
    url: siteUrl,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "XtheX - Global Outdoor Ad Marketplace",
      },
    ],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "XtheX - Global Outdoor Ad Marketplace",
    description:
      "Discover and match outdoor advertising media worldwide with map search and AI review.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      ko: `${siteUrl}/ko`,
      en: `${siteUrl}/en`,
      ja: `${siteUrl}/ja`,
      zh: `${siteUrl}/zh`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "XtheX",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/og-image.png` },
      description:
        "Global outdoor advertising marketplace connecting media owners and advertisers with AI.",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "XtheX",
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: ["ko", "en", "ja", "zh"],
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/ko/explore?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f97316" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        data-maps-key={mapsKey ? "set" : "not-set"}
      >
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <AuthSessionProvider>
          <ToastProvider>
            <BrightnessProvider>
              <ThemeProvider>
                <BrightnessThemeBridge />
                <NavigationProgress />
                <div id="main-content">{children}</div>
                <SonnerToaster />
                <ServiceWorkerRegistration />
              </ThemeProvider>
            </BrightnessProvider>
          </ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
