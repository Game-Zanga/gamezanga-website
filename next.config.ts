import type { NextConfig } from "next";

// Content Security Policy — strict-ish, tuned to what this app actually uses.
//
// - `script-src` allows 'unsafe-inline' + 'unsafe-eval' because Next.js's
//   client runtime injects inline scripts (and 'unsafe-eval' is needed by
//   Next's dev/HMR mode). Strict nonce-based CSP would require deeper Next
//   integration; revisit if we want belt-and-braces hardening.
// - `style-src` needs 'unsafe-inline' because Tailwind v4 + inline style="..."
//   attributes are used throughout (e.g. background gradients).
// - `connect-src` whitelists Supabase (REST + Realtime websockets). Resend is
//   server-only, no need.
// - `frame-ancestors 'none'` blocks clickjacking — site can't be iframed.
// - `form-action 'self'` prevents form posts from being hijacked cross-origin.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
];

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features we don't use — limits damage from a hypothetical XSS.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // HSTS — instruct browsers to always use HTTPS for gamezanga.net for 1 year.
  // Only meaningful on the production hostname; harmless on localhost (browsers
  // ignore HSTS over HTTP).
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
