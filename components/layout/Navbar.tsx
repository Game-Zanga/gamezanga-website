"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { JAM_CONFIG } from "@/lib/jam-config";

export function Navbar() {
  const { locale, toggle, tr } = useLocale();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", key: "nav_home" as const },
    { href: "/about", key: "nav_about" as const },
    { href: "/rules", key: "nav_rules" as const },
    { href: "/register", key: "nav_register" as const },
    { href: "/suggest", key: "nav_suggest" as const },
    { href: "/vote", key: "nav_vote" as const },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[color:var(--color-bg)]/70 border-b border-[color:var(--color-border)]">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group" aria-label="Home">
          <div
            className="w-9 h-9 rounded-lg grid place-items-center overflow-hidden"
            style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/gz-squarelogo.png"
              alt=""
              aria-hidden="true"
              className="w-7 h-7 object-contain"
            />
          </div>
          <div className="leading-tight">
            <div className="font-bold">
              {locale === "ar" ? JAM_CONFIG.name_ar : JAM_CONFIG.name_en}
            </div>
            <div className="text-xs text-[color:var(--color-muted)]">
              {locale === "ar" ? `النسخة ${JAM_CONFIG.edition}` : `Edition ${JAM_CONFIG.edition}`}
            </div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded-md text-sm hover:bg-[color:var(--color-surface)] transition-colors"
            >
              {tr(l.key)}
            </Link>
          ))}
          <button
            onClick={toggle}
            className="ms-2 px-3 py-1.5 rounded-md border border-[color:var(--color-border)] text-sm hover:bg-[color:var(--color-surface)]"
            aria-label="Toggle language"
          >
            {tr("lang_toggle")}
          </button>
        </div>

        <button
          className="md:hidden p-2 rounded-md border border-[color:var(--color-border)]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <>
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-[color:var(--color-border)] bg-[color:var(--color-bg-2)]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-2 rounded-md hover:bg-[color:var(--color-surface)]"
                onClick={() => setOpen(false)}
              >
                {tr(l.key)}
              </Link>
            ))}
            <button
              onClick={() => {
                toggle();
                setOpen(false);
              }}
              className="text-start px-3 py-2 rounded-md border border-[color:var(--color-border)] mt-2"
            >
              {tr("lang_toggle")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
