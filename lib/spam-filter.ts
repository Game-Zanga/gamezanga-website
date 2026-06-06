// Hardcoded spam-signature blocklist for /api/register.
//
// Triggered when a sophisticated bot is bypassing Turnstile and rate limiting
// (e.g. via a CAPTCHA-solver service). Catches each spammer's specific
// fingerprint immediately, so cleanup damage is bounded by how fast we add
// new entries.
//
// Add new patterns here when a spammer adopts a new signature. Each match
// causes /api/register to silently accept the request (returning fake success)
// without inserting anything — this keeps the attacker guessing and makes them
// waste CAPTCHA-solver budget on null effort.

// Exact names that are known bot signatures (case-insensitive).
const BLOCKED_NAMES = new Set([
  "def4auld lzelkfe",
  "عمك يحرق دمك",
]);

// Email pattern: 8-4-4-4-12 hex UUID @ anywhere. No legitimate user has these.
const UUID_EMAIL_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}@/i;

export type SpamCheckResult = { ok: true } | { ok: false; reason: string };

export function checkSpamSignature(input: { full_name: string; email: string }): SpamCheckResult {
  const name = (input.full_name ?? "").trim().toLowerCase();
  const email = (input.email ?? "").trim().toLowerCase();

  if (BLOCKED_NAMES.has(name)) {
    return { ok: false, reason: `blocked-name:${name}` };
  }
  if (UUID_EMAIL_RE.test(email)) {
    return { ok: false, reason: "uuid-email" };
  }
  return { ok: true };
}
