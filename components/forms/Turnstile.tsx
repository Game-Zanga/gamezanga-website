"use client";

import { useEffect, useRef } from "react";

// Cloudflare Turnstile widget — invisible/managed CAPTCHA that produces a
// one-time token. The parent form sends the token to the server, which
// verifies it via siteverify before processing the request.
//
// Renders nothing if NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set, so local dev
// without the env var configured still works.

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC_PREFIX = "https://challenges.cloudflare.com/turnstile/v0/api.js";

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("server"));
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src^="${SCRIPT_SRC_PREFIX}"]`);
    if (existing) {
      // Already loading — wait until window.turnstile exists.
      const check = setInterval(() => {
        if (window.turnstile) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      setTimeout(() => { clearInterval(check); reject(new Error("Turnstile script timeout")); }, 10000);
      return;
    }
    const s = document.createElement("script");
    s.src = `${SCRIPT_SRC_PREFIX}?render=explicit`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Turnstile script"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

type Props = {
  onToken: (token: string) => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
};

export function Turnstile({ onToken, onError, theme = "dark" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!sitekey || !containerRef.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          theme,
          callback: (token: string) => onToken(token),
          "error-callback": () => onError?.(),
          "expired-callback": () => onToken(""),
        });
      })
      .catch(() => {
        if (!cancelled) onError?.();
      });

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      if (id && window.turnstile) {
        try { window.turnstile.remove(id); } catch { /* ignore */ }
      }
      widgetIdRef.current = null;
    };
    // We intentionally run this exactly once on mount. The parent component
    // bumps a `key` prop to force a remount when it needs a fresh token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If env var isn't set (e.g. local dev), render nothing — the form will
  // still submit and /api/register will skip verification if its secret is
  // also missing.
  if (!sitekey) return null;

  return <div ref={containerRef} className="my-4 flex justify-center min-h-[70px]" />;
}
