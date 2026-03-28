/**
 * Required environment variables validation.
 *
 * Import this module in instrumentation.ts or next.config.mjs to fail fast
 * when critical env vars are missing.
 */

interface EnvRule {
  key: string;
  /** Only required in production (NODE_ENV=production) */
  productionOnly?: boolean;
  /** Human-friendly hint shown on error */
  hint?: string;
}

const REQUIRED_ENV: EnvRule[] = [
  {
    key: "DATABASE_URL",
    hint: "PostgreSQL connection string (e.g. Neon: https://neon.tech)",
  },
  {
    key: "NEXTAUTH_SECRET",
    hint: "openssl rand -base64 32",
  },
  {
    key: "NEXTAUTH_URL",
    productionOnly: false,
    hint: "e.g. http://localhost:3000 (dev) or https://xthex.com (prod)",
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    productionOnly: true,
    hint: "e.g. https://xthex.com",
  },
];

export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === "production";
  const missing: string[] = [];

  for (const rule of REQUIRED_ENV) {
    if (rule.productionOnly && !isProd) continue;

    const value = process.env[rule.key]?.trim();
    if (!value) {
      const hint = rule.hint ? ` (${rule.hint})` : "";
      missing.push(`  - ${rule.key}${hint}`);
    }
  }

  if (missing.length > 0) {
    const header = isProd
      ? "🚨 Missing required environment variables for production build:"
      : "⚠️  Missing environment variables:";
    const message = `${header}\n${missing.join("\n")}`;

    if (isProd) {
      console.error(message);
      throw new Error(
        `Build aborted: ${missing.length} required env var(s) missing. See logs above.`,
      );
    }

    console.warn(message);
  }
}
