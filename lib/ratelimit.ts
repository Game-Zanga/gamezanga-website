// IP-based rate limiter backed by Upstash Redis.
//
// Pragmatic design:
//   - If the Upstash env vars are NOT set (local dev, preview deploys without
//     KV configured), this module SILENTLY allows every request. That keeps
//     development frictionless and prevents the prod redeploy after enabling
//     KV from breaking other environments.
//   - When env vars ARE set, every call to checkRateLimit() debits the
//     specified bucket. On limit-hit the route should return 429.
//
// Setup (one-time, in Vercel):
//   1. Vercel Dashboard → Storage → Create → Upstash Redis (or KV) → connect
//      to your project. Vercel injects UPSTASH_REDIS_REST_URL and
//      UPSTASH_REDIS_REST_TOKEN automatically.
//   2. Redeploy.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

// One Ratelimit instance per bucket — they're cheap to create but caching is
// nicer. Each bucket gets a sliding-window of N requests per duration.
const limiters: Record<string, Ratelimit> = {};

function getLimiter(bucket: string, limit: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${bucket}:${limit}:${windowSeconds}`;
  if (!limiters[key]) {
    limiters[key] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: false,
      prefix: `rl:${bucket}`,
    });
  }
  return limiters[key];
}

// Extract a best-effort client identifier for rate-limit keys. In order of
// preference: CF-Connecting-IP > X-Forwarded-For (first hop) > X-Real-IP.
// Falls back to "anon" when none are present (dev). Using IP alone is
// imperfect (NAT, mobile carriers) but is the standard pragmatic approach.
function getClientKey(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri;
  return "anon";
}

export type RateLimitOptions = {
  /** Bucket name — separates limits for different endpoints. */
  bucket: string;
  /** Max requests per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
  /** Optional extra key suffix (e.g. email) to scope the limit beyond IP. */
  extra?: string;
};

export type RateLimitResult = {
  /** True if the request is allowed. */
  ok: boolean;
  /** Seconds the client should wait before retrying (best-effort). */
  retryAfter?: number;
};

/**
 * Check the rate limit for the given request + bucket.
 * Returns { ok: true } when Upstash is not configured (so dev works).
 */
export async function checkRateLimit(req: Request, opts: RateLimitOptions): Promise<RateLimitResult> {
  const limiter = getLimiter(opts.bucket, opts.limit, opts.windowSeconds);
  if (!limiter) return { ok: true }; // Upstash not configured — fail open
  const id = getClientKey(req) + (opts.extra ? `:${opts.extra}` : "");
  const res = await limiter.limit(id);
  if (res.success) return { ok: true };
  const retryAfter = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
  return { ok: false, retryAfter };
}
