"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Link from "next/link";
import { JAM_CONFIG } from "@/lib/jam-config";
import { formatArabicDateRange, formatEnglishDateRange } from "@/lib/date-format";
import { areResultsOut } from "@/lib/phase-utils";

/**
 * Save-the-date for the next edition. Appears only once the current edition is
 * closed out (results aired) — before that the page has a live jam to talk
 * about and a second set of dates would just compete with it.
 */
export function NextEdition() {
  const { locale, tr } = useLocale();
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setShow(areResultsOut());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  if (show !== true) return null;

  const next = JAM_CONFIG.next_edition;
  const range =
    locale === "ar"
      ? formatArabicDateRange(next.jam_start, next.jam_end)
      : formatEnglishDateRange(next.jam_start, next.jam_end);

  return (
    <section className="max-w-4xl mx-auto px-4 pb-16">
      <div
        className="rounded-2xl border p-8 md:p-12 text-center"
        style={{
          // Next edition wears its own palette — turquoise on the same black —
          // so the two years are visually distinct on a page that shows both.
          borderColor: "color-mix(in oklab, var(--color-next-accent) 50%, transparent)",
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--color-next-accent) 14%, transparent), color-mix(in oklab, var(--color-next-accent-2) 9%, transparent))",
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
          <span className="text-xs uppercase tracking-widest text-[color:var(--color-muted)]">
            {tr("next_edition_kicker")}
          </span>
          <span
            className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
            style={{
              background: "var(--color-next-accent)",
              // white on turquoise is 1.86:1 — the fill takes dark ink instead
              color: "var(--color-next-ink)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-next-ink)] animate-pulse" />
            {tr("next_edition_reg_open")}
          </span>
        </div>

        <div
          className={`font-black leading-tight mb-3 ${
            locale === "ar" ? "text-4xl md:text-6xl" : "text-4xl md:text-5xl"
          }`}
          style={{
            background:
              "linear-gradient(135deg, var(--color-next-accent), var(--color-next-accent-2))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {tr("next_edition_heading")}
        </div>

        <div className="text-lg md:text-xl font-bold mb-2">{range}</div>
        <div className="text-xs text-[color:var(--color-muted)] mb-6">{tr("ksa_time")}</div>

        <p className="text-[color:var(--color-muted)] leading-relaxed max-w-2xl mx-auto mb-8">
          {tr("next_edition_body")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="btn w-full sm:w-auto text-center font-bold"
            style={{
              background:
                "linear-gradient(135deg, var(--color-next-accent), var(--color-next-accent-2))",
              color: "var(--color-next-ink)",
            }}
          >
            {tr("next_edition_register")}
          </Link>
          <a
            href={JAM_CONFIG.discord_url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost w-full sm:w-auto text-center"
          >
            {tr("join_discord_cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
