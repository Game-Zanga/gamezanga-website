"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { JAM_CONFIG } from "@/lib/jam-config";
import { formatArabicDateRange, formatEnglishDateRange } from "@/lib/date-format";
import { areResultsOut, isRatingOver } from "@/lib/phase-utils";
import { useEffect, useState } from "react";
import { Countdown } from "./Countdown";

export function Hero() {
  const { locale, tr } = useLocale();

  // Date-dependent, so it can only be decided after mount.
  const [phase, setPhase] = useState<"live" | "premiere" | "next" | null>(null);
  useEffect(() => {
    const update = () =>
      setPhase(areResultsOut() ? "next" : isRatingOver() ? "premiere" : "live");
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  // Once this edition is closed out the hero belongs to the next one —
  // otherwise it advertises dates that have already passed next to a register
  // button that signs you up for a different year.
  const showNext = phase === "next";
  const dateRange = showNext
    ? formatDateRange(JAM_CONFIG.next_edition.jam_start, JAM_CONFIG.next_edition.jam_end, locale)
    : formatDateRange(JAM_CONFIG.jam_start, JAM_CONFIG.jam_end, locale);

  return (
    <section className="relative bg-grid">
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 text-xs text-[color:var(--color-muted)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[color:var(--color-accent)] animate-pulse" />
            {tr("edition_label")} {showNext ? JAM_CONFIG.next_edition.edition : JAM_CONFIG.edition}
          </div>
          <h1>
            <span className="sr-only">{locale === "ar" ? JAM_CONFIG.name_ar : JAM_CONFIG.name_en}</span>
            <span
              aria-hidden="true"
              role="img"
              aria-label={locale === "ar" ? JAM_CONFIG.name_ar : JAM_CONFIG.name_en}
              className="block mx-auto w-full max-w-[280px] sm:max-w-[480px] md:max-w-[640px] lg:max-w-[900px]"
              style={{
                aspectRatio: "11823 / 2418",
                WebkitMaskImage: "url(/images/gz-logo.png)",
                maskImage: "url(/images/gz-logo.png)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
              }}
            />
          </h1>
          <p className="mt-4 text-lg md:text-xl text-[color:var(--color-muted)]">
            {locale === "ar" ? JAM_CONFIG.tagline_ar : JAM_CONFIG.tagline_en}
          </p>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">{dateRange}</p>

          <div className="mt-10">
            <Countdown />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {phase === "premiere" ? (
              <a
                href={`https://youtu.be/${JAM_CONFIG.results_video_id}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                {tr("hero_watch_results")}
              </a>
            ) : (
              <Link href="/register" className="btn btn-primary">
                {tr("cta_register_now")}
              </Link>
            )}
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
  return locale === "ar"
    ? formatArabicDateRange(startISO, endISO)
    : formatEnglishDateRange(startISO, endISO);
}
