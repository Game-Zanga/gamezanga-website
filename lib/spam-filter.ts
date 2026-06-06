// Spam signature blocklist for /api/register.
//
// Two layers:
//   1. STATIC — hardcoded patterns (deploy-time changes). Fast, in-memory.
//   2. DYNAMIC — Upstash KV set, populated by /api/cron/spam-report when it
//      detects a name repeated >5 times within an hour. No redeploy needed.
//
// Shadowban behavior: /api/register returns fake success on match — the bot
// thinks the write worked and stops trying to vary its payload.

import { Redis } from "@upstash/redis";

// Exact names that are known bot signatures (case-insensitive).
const BLOCKED_NAMES_STATIC = new Set<string>([
  "def4auld lzelkfe",
  "عمك يحرق دمك",
]);

// Email pattern: 8-4-4-4-12 hex UUID @ anywhere.
const UUID_EMAIL_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}@/i;

export const DYNAMIC_BLOCKLIST_KEY = "blocklist:names";

// Lazily-initialized Redis client. Same dual-naming pattern as lib/ratelimit.ts
// so it works with either UPSTASH_REDIS_REST_* or KV_REST_API_* env vars.
let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  redisClient = new Redis({ url, token });
  return redisClient;
}

export type SpamCheckResult = { ok: true } | { ok: false; reason: string };

export async function checkSpamSignature(input: {
  full_name: string;
  email: string;
}): Promise<SpamCheckResult> {
  const name = (input.full_name ?? "").trim().toLowerCase();
  const email = (input.email ?? "").trim().toLowerCase();

  if (BLOCKED_NAMES_STATIC.has(name)) {
    return { ok: false, reason: `blocked-name-static:${name}` };
  }
  if (UUID_EMAIL_RE.test(email)) {
    return { ok: false, reason: "uuid-email" };
  }

  // Dynamic check — single SISMEMBER call, ~5ms p99.
  const r = getRedis();
  if (r) {
    try {
      const isBlocked = await r.sismember(DYNAMIC_BLOCKLIST_KEY, name);
      if (isBlocked) {
        return { ok: false, reason: `blocked-name-dynamic:${name}` };
      }
    } catch (e) {
      // If KV is down, fail open (allow). Static check still runs first so
      // the worst-known signatures are still blocked.
      console.warn("Spam filter Upstash check failed:", e);
    }
  }

  return { ok: true };
}
