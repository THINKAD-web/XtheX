import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { ToastProvider } from "@/components/ui/use-toast";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import { BrightnessProvider } from "@/components/brightness/BrightnessPreference";
import { BrightnessThemeBridge } from "@/components/brightness/BrightnessThemeBridge";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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

export const metadata: Metadata = {
  title: "XtheX - Global Outdoor Ad Marketplace",
  description:
    "XtheX is a global outdoor advertising marketplace where partners upload media proposals and brands discover, match, and contract.",
  applicationName: "XtheX",
  metadataBase: (() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (appUrl) return new URL(appUrl);
    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) return new URL(`https://${vercelUrl}`);
    return new URL("https://xthex.com");
  })(),
  openGraph: {
    title: "XtheX - Global Outdoor Ad Marketplace",
    description:
      "Discover and match outdoor advertising media worldwide. Partners upload proposals, AI reviews, admins approve, and brands explore on a map.",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "XtheX - Global Outdoor Ad Marketplace",
    description:
      "Discover and match outdoor advertising media worldwide with map search and AI review.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        data-maps-key={mapsKey ? "set" : "not-set"}
      >
        <AuthSessionProvider>
          <ToastProvider>
            <BrightnessProvider>
              <ThemeProvider>
                <BrightnessThemeBridge />
                {children}
                <SonnerToaster />
              </ThemeProvider>
            </BrightnessProvider>
          </ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
