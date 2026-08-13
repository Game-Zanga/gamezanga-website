"use client";

import { useLocale } from "@/components/LocaleProvider";
import { PhaseGate } from "@/components/ui/PhaseGate";
import { JAM_CONFIG } from "@/lib/jam-config";
import { formatArabicDeadline, formatEnglishDeadline } from "@/lib/date-format";
import { getCurrentPhase } from "@/lib/phase-utils";
import { useEffect, useState } from "react";

/**
 * The home page's headline block once the theme is out: theme word, the
 * announcement video, and the submission CTA.
 *
 * Gated on the announced/jam phases so it can never leak the theme early — the
 * whole point of the reveal is that nobody sees it before the video drops.
 */
export function ThemeReveal() {
  return (
    <PhaseGate allow={["announced", "jam_active", "jam_ended"]}>
      <RevealBody />
    </PhaseGate>
  );
}

function RevealBody() {
  const { locale, tr } = useLocale();
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const update = () => setEnded(getCurrentPhase() === "jam_ended");
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  const themeAr = JAM_CONFIG.announced_theme_ar;
  const themeEn = JAM_CONFIG.announced_theme_en;
  const primary = locale === "ar" ? themeAr : themeEn || themeAr;
  const secondary = locale === "ar" ? themeEn : themeAr;

  const deadline =
    locale === "ar"
      ? formatArabicDeadline(JAM_CONFIG.jam_end)
      : formatEnglishDeadline(JAM_CONFIG.jam_end);

  return (
    <section className="max-w-4xl mx-auto px-4 pt-4 pb-16">
      <div className="card-glow p-6 md:p-10">
        {/* live pill */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 text-xs text-[color:var(--color-muted)]">
            {!ended && (
              <span className="w-2 h-2 rounded-full bg-[color:var(--color-success)] animate-pulse" />
            )}
            {ended ? tr("jam_ended_browse") : tr("jam_live_now")}
          </span>
        </div>

        {/* the theme */}
        <div className="text-center mb-8">
          <div className="text-xs uppercase tracking-widest text-[color:var(--color-muted)] mb-3">
            {tr("theme_announced_label")}
          </div>
          {/* Arabic gets a size up: at a given font-size Cairo's Arabic glyphs sit
              smaller in the em box than Latin, so matching numbers look mismatched. */}
          <div
            className={`font-black text-glow break-words ${
              locale === "ar" ? "text-6xl md:text-8xl leading-[1.25]" : "text-5xl md:text-7xl leading-tight"
            }`}
          >
            {primary}
          </div>
          {secondary && secondary !== primary && (
            <div
              className="text-lg md:text-xl text-[color:var(--color-muted)] mt-3"
              dir={locale === "ar" ? "ltr" : "rtl"}
            >
              {secondary}
            </div>
          )}
        </div>

        {/* announcement video — 16:9, responsive */}
        {JAM_CONFIG.announcement_video_id && (
          <div className="mb-8">
            <div
              className="relative w-full overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-black"
              style={{ aspectRatio: "16 / 9" }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${JAM_CONFIG.announcement_video_id}?rel=0`}
                title={tr("watch_announcement")}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* submission CTA */}
        <div className="flex flex-col items-center gap-4">
          <a
            href={JAM_CONFIG.itchio_url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary text-base md:text-lg w-full sm:w-auto text-center"
          >
            {ended ? tr("view_entries") : tr("submit_your_game")}
          </a>

          {!ended && (
            <div className="text-center text-sm text-[color:var(--color-muted)]">
              <span className="font-medium text-[color:var(--color-fg)]">
                {tr("submission_deadline")}:
              </span>{" "}
              {deadline}
              <div className="text-xs mt-1">{tr("ksa_time")}</div>
            </div>
          )}

          <a
            href={JAM_CONFIG.discord_url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost text-sm"
          >
            {tr("join_discord_cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
