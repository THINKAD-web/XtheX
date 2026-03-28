import { NextResponse } from "next/server";

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Works per serverless instance — sufficient for basic abuse prevention.
 * For production with multiple instances, swap to @upstash/ratelimit + Redis:
 *
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 *   const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "60 s") });
 */

interface SlidingWindow {
  timestamps: number[];
}

const store = new Map<string, SlidingWindow>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Max requests per window (default: 20) */
  limit?: number;
  /** Window duration in ms (default: 60_000 = 1 minute) */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

function getIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export function checkRateLimit(
  req: Request,
  config: RateLimitConfig = {},
): RateLimitResult {
  const limit = config.limit ?? 20;
  const windowMs = config.windowMs ?? 60_000;
  const now = Date.now();
  const ip = getIdentifier(req);

  const url = new URL(req.url);
  const key = `${ip}:${url.pathname}`;

  cleanup(windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  const cutoff = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0]!;
    return { allowed: false, remaining: 0, resetMs: oldest + windowMs - now };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetMs: windowMs,
  };
}

export function rateLimitResponse(resetMs: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(resetMs / 1000)) },
    },
  );
}

/**
 * Convenience: check rate limit and return NextResponse | null.
 * If null, the request is allowed; otherwise return the response.
 */
export function withRateLimit(
  req: Request,
  config?: RateLimitConfig,
): NextResponse | null {
  const result = checkRateLimit(req, config);
  if (!result.allowed) return rateLimitResponse(result.resetMs);
  return null;
}
