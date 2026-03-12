import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XtheX - Global Outdoor Ad Marketplace",
  description:
    "XtheX is a global outdoor advertising marketplace where partners upload media proposals and brands discover, match, and contract.",
  applicationName: "XtheX",
  // Adjust to your production domain later (e.g. https://xthex.com)
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
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
    <ClerkProvider>
      <html lang="ko" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          data-maps-key={mapsKey ? "set" : "not-set"}
        >
          {mapsKey ? (
            <Script
              id="google-maps-js"
              strategy="afterInteractive"
              src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
                mapsKey
              )}&libraries=places`}
            />
          ) : null}
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
