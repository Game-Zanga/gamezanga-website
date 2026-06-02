// CSRF protection: enforce that mutating requests originate from our own site.
//
// Browsers send the `Origin` header on cross-origin POSTs (and on most same-
// origin POSTs since modern browsers). When present, it cannot be spoofed by
// page JavaScript — it's set by the browser based on the actual document URL.
// If it doesn't match our site, the request is from a malicious site (or
// someone testing with curl, which is fine to allow since they don't carry
// Supabase auth cookies anyway).
//
// We fall back to checking `Referer` only if `Origin` is absent, because some
// older clients omit Origin. If neither is present we ALLOW the request — this
// avoids blocking server-to-server calls and dev tools, at the small cost of
// not protecting against a hypothetical browser that strips both headers
// (essentially nonexistent in 2026).

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

export function isSameOrigin(req: Request): boolean {
  if (!ALLOWED_ORIGIN) return true; // dev fallback — env not set, can't enforce

  const origin = req.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "") === ALLOWED_ORIGIN;

  const referer = req.headers.get("referer");
  if (referer) return referer.startsWith(ALLOWED_ORIGIN);

  // No Origin and no Referer — likely a non-browser client. Allow.
  return true;
}
