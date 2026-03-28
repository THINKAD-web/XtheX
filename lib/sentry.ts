/**
 * Sentry error tracking placeholder.
 *
 * To activate:
 * 1. npm install @sentry/nextjs
 * 2. Set SENTRY_DSN in environment variables
 * 3. Uncomment the init block in instrumentation.ts
 * 4. Optionally create sentry.client.config.ts / sentry.server.config.ts
 */

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.SENTRY_DSN) {
    // When @sentry/nextjs is installed:
    // import * as Sentry from "@sentry/nextjs";
    // Sentry.captureException(error, { extra: context });
    console.error("[sentry-placeholder]", error, context);
    return;
  }

  console.error("[error-tracking]", error, context);
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
  if (process.env.SENTRY_DSN) {
    // Sentry.captureMessage(message, level);
    console.log(`[sentry-placeholder:${level}]`, message);
    return;
  }

  console.log(`[${level}]`, message);
}
