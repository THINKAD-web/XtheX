/**
 * Environment variable checks for startup logging.
 *
 * Called from instrumentation on server boot. Missing values are logged only;
 * the app can still serve public routes without DATABASE_URL (see isDatabaseConfigured).
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
      ? "🚨 Missing environment variables (set these for full functionality):"
      : "⚠️  Missing environment variables:";
    const message = `${header}\n${missing.join("\n")}`;

    // Never throw: instrumentation runs on every `next start` / serverless cold start.
    // Public pages (e.g. home) intentionally work without DB via isDatabaseConfigured();
    // throwing here caused 500 on the entire site when DATABASE_URL or NEXTAUTH_SECRET
    // were unset in preview/local prod runs.
    if (isProd) {
      console.error(message);
    } else {
      console.warn(message);
    }
  }
}
