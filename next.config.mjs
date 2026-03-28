import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Smaller serverless bundles on Vercel; deployment still runs `next start` via Vercel’s adapter. */
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  /** clsx/tailwind-merge: avoid RSC webpack bundle edge cases (undefined .call in utils.ts). */
  serverExternalPackages: [
    "@prisma/client",
    "pdfjs-dist",
    "canvas",
    "sharp",
    "clsx",
    "tailwind-merge",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@radix-ui/react-accordion",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-popover",
      "framer-motion",
      "zustand",
    ],
  },
  /**
   * Reduce output file tracing for API/serverless routes (Vercel 250MB unzipped limit).
   * Leaflet/react-leaflet are client-only; uploads/cache must not ship with functions.
   */
  outputFileTracingExcludes: {
    "*": [
      ".next/cache/**/*",
      "public/uploads/**/*",
      "node_modules/@next/swc-linux-x64-gnu/**/*",
      "node_modules/@next/swc-linux-x64-musl/**/*",
      "node_modules/@next/swc-darwin-*/**/*",
      "node_modules/@img/**/*",
      "node_modules/sharp/**/*",
      "node_modules/canvas/**/*",
      "node_modules/pdfjs-dist/**/*",
      "node_modules/recharts/**/*",
      "node_modules/leaflet.markercluster/**/*",
      "node_modules/leaflet/**/*",
      "node_modules/react-leaflet/**/*",
    ],
  },
  outputFileTracingIncludes: {
    "/api/admin/upload-proposal": [
      "node_modules/pdfjs-dist/**/*",
      "node_modules/canvas/**/*",
    ],
    "/api/admin/reparse-proposal": [
      "node_modules/pdfjs-dist/**/*",
      "node_modules/canvas/**/*",
    ],
    "/api/reparse-media": [
      "node_modules/pdfjs-dist/**/*",
      "node_modules/canvas/**/*",
    ],
  },
  /**
   * 홈 등 큰 페이지 첫 컴파일이 길 때 ChunkLoadError(timeout) 완화 (dev 클라이언트만).
   * @see https://github.com/vercel/next.js/issues/66526
   */
  webpack: (config, { dev, isServer }) => {
    if (isServer) {
      const extraExternals = ["canvas", "pdfjs-dist", "sharp"];
      if (Array.isArray(config.externals)) {
        config.externals = [...config.externals, ...extraExternals];
      } else if (config.externals) {
        config.externals = [config.externals, ...extraExternals];
      } else {
        config.externals = extraExternals;
      }
    }
    if (dev && !isServer) {
      config.output = {
        ...config.output,
        chunkLoadTimeout: 120_000,
      };
    }
    return config;
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

import bundleAnalyzer from "@next/bundle-analyzer";
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});
export default withBundleAnalyzer(withNextIntl(nextConfig));

