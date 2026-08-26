"use client";

import { useLocale } from "@/components/LocaleProvider";
import { PhaseGate } from "@/components/ui/PhaseGate";
import { JAM_CONFIG } from "@/lib/jam-config";
import { formatArabicDeadline, formatEnglishDeadline } from "@/lib/date-format";
import { areResultsOut, isRatingOpen, isRatingOver } from "@/lib/phase-utils";
import { useEffect, useState } from "react";

type Stage = "submit" | "rate" | "over" | "results";

function currentStage(now = new Date()): Stage {
  if (areResultsOut(now)) return "results";
  if (isRatingOver(now)) return "over";
  if (isRatingOpen(now)) return "rate";
  return "submit";
}

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
  // null until mounted so the server and client agree; the interval flips the
  // block from "submit" to "rate" on its own the moment submissions close.
  const [stage, setStage] = useState<Stage | null>(null);

  useEffect(() => {
    const update = () => setStage(currentStage());
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  const themeAr = JAM_CONFIG.announced_theme_ar;
  const themeEn = JAM_CONFIG.announced_theme_en;
  const primary = locale === "ar" ? themeAr : themeEn || themeAr;
  const secondary = locale === "ar" ? themeEn : themeAr;

  if (stage === null) return null;

  const fmt = (iso: string) =>
    locale === "ar" ? formatArabicDeadline(iso) : formatEnglishDeadline(iso);

  const deadline = fmt(JAM_CONFIG.jam_end);
  const ratingDeadline = fmt(JAM_CONFIG.rating_close);

  // Once the premiere airs the results video takes the slot — the theme reveal
  // is history by then, and the results are what people arrive for.
  // From the moment rating closes the results video takes the slot: before the
  // premiere airs YouTube renders its own countdown and "Notify me" inside the
  // player, which promotes it far better than a link underneath.
  const videoId =
    stage === "results" || stage === "over"
      ? JAM_CONFIG.results_video_id
      : JAM_CONFIG.announcement_video_id;
  const premiereUrl = `https://youtu.be/${JAM_CONFIG.results_video_id}`;
  const premiereAt = fmt(JAM_CONFIG.results_announced);

  const pill =
    stage === "rate" ? tr("rating_open_now")
    : stage === "results" ? tr("results_out_pill")
    : stage === "over" ? tr("voting_closed_pill")
    : tr("jam_live_now");

  return (
    <section className="max-w-4xl mx-auto px-4 pt-4 pb-16">
      <div className="card-glow p-6 md:p-10">
        {/* live pill */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 text-xs text-[color:var(--color-muted)]">
            {stage !== "over" && (
              <span className="w-2 h-2 rounded-full bg-[color:var(--color-success)] animate-pulse" />
            )}
            {pill}
          </span>
        </div>

        {stage !== "submit" && (
          <p className="text-center text-xl md:text-2xl font-bold mb-6">
            {stage === "rate" ? tr("rating_heading")
              : stage === "results" ? tr("results_heading")
              : tr("results_soon_heading")}
          </p>
        )}

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
        {videoId && (
          <div className="mb-8">
            <div
              className="relative w-full overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-black"
              style={{ aspectRatio: "16 / 9" }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                title={stage === "results" ? tr("results_watch") : tr("watch_announcement")}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {stage !== "submit" && (
          <p className="text-center text-[color:var(--color-muted)] leading-relaxed mb-8 max-w-2xl mx-auto">
            {stage === "rate" ? tr("rating_intro")
              : stage === "results" ? tr("wrap_thanks")
              : tr("results_soon_body")}
          </p>
        )}

        {/* primary CTA — submit during the jam, play-and-rate afterwards */}
        <div className="flex flex-col items-center gap-4">
          <a
            href={stage === "over" ? premiereUrl : JAM_CONFIG.itchio_url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary text-base md:text-lg w-full sm:w-auto text-center"
          >
            {stage === "rate" ? tr("rating_cta")
              : stage === "results" ? tr("view_entries")
              : stage === "over" ? tr("watch_premiere_cta")
              : tr("submit_your_game")}
          </a>

          {stage === "submit" && (
            <div className="text-center text-sm text-[color:var(--color-muted)]">
              <span className="font-medium text-[color:var(--color-fg)]">
                {tr("submission_deadline")}:
              </span>{" "}
              {deadline}
              <div className="text-xs mt-1">{tr("ksa_time")}</div>
            </div>
          )}

          {stage === "rate" && (
            <div className="text-center text-sm text-[color:var(--color-muted)]">
              <span className="font-medium text-[color:var(--color-fg)]">{tr("rating_closes")}:</span>{" "}
              {ratingDeadline}
              <div className="text-xs mt-1">{tr("ksa_time")}</div>
            </div>
          )}

          {stage === "over" && (
            <div className="text-center text-sm text-[color:var(--color-muted)]">
              <span className="font-medium text-[color:var(--color-fg)]">
                {tr("results_premiere_at")}:
              </span>{" "}
              {premiereAt}
              <div className="text-xs mt-1">{tr("ksa_time")}</div>
              <a
                href={JAM_CONFIG.itchio_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 text-[color:var(--color-accent)] underline underline-offset-4"
              >
                {tr("view_entries")}
              </a>
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

        {/* Edition wrap-up — the numbers, once the results have aired */}
        {stage === "results" && (
          <div className="mt-10">
            <div className="text-center text-xs uppercase tracking-widest text-[color:var(--color-muted)] mb-5">
              {tr("wrap_heading")}
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {[
                { n: JAM_CONFIG.edition_stats.registered.toLocaleString("en-US"), l: tr("wrap_registered") },
                { n: String(JAM_CONFIG.edition_stats.games), l: tr("wrap_games") },
                { n: String(JAM_CONFIG.edition_stats.countries), l: tr("wrap_countries") },
              ].map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/40 p-4 text-center"
                >
                  <div
                    className="text-3xl md:text-4xl font-black"
                    style={{
                      background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                    dir="ltr"
                  >
                    {s.n}
                  </div>
                  <div className="text-xs text-[color:var(--color-muted)] mt-1 leading-snug">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Games unlock for editing once rating closes — people ask every year */}
        {stage === "over" && (
          <div
            className="mt-8 rounded-xl border p-5 md:p-6 text-sm leading-relaxed"
            style={{
              borderColor: "color-mix(in oklab, var(--color-accent-2) 45%, transparent)",
              background: "color-mix(in oklab, var(--color-accent-2) 8%, transparent)",
            }}
          >
            {tr("update_game_note")}
          </div>
        )}

        {/* itch.io's rating rules trip people up every year — spell them out */}
        {stage === "rate" && (
          <div
            className="mt-8 rounded-xl border p-5 md:p-6"
            style={{
              borderColor: "color-mix(in oklab, var(--color-accent) 40%, transparent)",
              background: "color-mix(in oklab, var(--color-accent) 7%, transparent)",
            }}
          >
            <div className="font-bold mb-3">{tr("rating_rules_heading")}</div>
            <ul className="space-y-2.5 text-sm text-[color:var(--color-muted)] leading-relaxed">
              {[tr("rating_rule_who"), tr("rating_rule_queue"), tr("rating_rule_fair")].map((line, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="shrink-0 w-5 h-5 mt-0.5 rounded-full grid place-items-center text-[11px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
