"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { JAM_CONFIG } from "@/lib/jam-config";
import { Countdown } from "./Countdown";

export function Hero() {
  const { locale, tr } = useLocale();
  const dateRange = formatDateRange(JAM_CONFIG.jam_start, JAM_CONFIG.jam_end, locale);

  return (
    <section className="relative bg-grid">
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 text-xs text-[color:var(--color-muted)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[color:var(--color-accent)] animate-pulse" />
            {tr("edition_label")} {JAM_CONFIG.edition}
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
              }}
            >
              {locale === "ar" ? JAM_CONFIG.name_ar : JAM_CONFIG.name_en}
            </span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-[color:var(--color-muted)]">
            {locale === "ar" ? JAM_CONFIG.tagline_ar : JAM_CONFIG.tagline_en}
          </p>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">{dateRange}</p>

          <div className="mt-10">
            <Countdown />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn btn-primary">
              {tr("cta_register_now")}
            </Link>
            <Link href="/rules" className="btn btn-ghost">
              {tr("cta_view_rules")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatDateRange(startISO: string, endISO: string, locale: "ar" | "en") {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  });
  return `${fmt.format(start)} — ${fmt.format(end)}`;
}
