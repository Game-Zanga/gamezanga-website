"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { TOP_GAMES, type ResultEntry } from "@/lib/results";
import { areResultsOut } from "@/lib/phase-utils";

const ORDINAL_AR: Record<number, string> = {
  1: "الأول", 2: "الثاني", 3: "الثالث", 4: "الرابع", 5: "الخامس",
  6: "السادس", 7: "السابع", 8: "الثامن", 9: "التاسع", 10: "العاشر",
};

/**
 * The final top-10, revealed with the results premiere. Hidden before it —
 * the standings are the whole point of the stream, so they must not be
 * readable from the page (or scraped from the HTML) beforehand.
 */
export function TopGames() {
  const { locale, tr } = useLocale();
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setShow(areResultsOut());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  if (show !== true) return null;

  const winner = TOP_GAMES.find((g) => g.rank === 1);
  const rest = TOP_GAMES.filter((g) => g.rank !== 1).sort((a, b) => a.rank - b.rank);

  return (
    <section className="max-w-4xl mx-auto px-4 pb-16">
      <h2 className="text-xl md:text-2xl font-bold text-center mb-2">{tr("top_games_heading")}</h2>
      <p className="text-center text-sm text-[color:var(--color-muted)] mb-6">{tr("top_games_sub")}</p>

      {winner && <WinnerCard game={winner} locale={locale} tr={tr} />}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
        {rest.map((g) => (
          <GameCard key={g.rank} game={g} locale={locale} />
        ))}
      </div>
    </section>
  );
}

function rankLabel(rank: number, locale: "ar" | "en") {
  return locale === "ar" ? `المركز ${ORDINAL_AR[rank]}` : `#${rank}`;
}

function WinnerCard({
  game, locale, tr,
}: {
  game: ResultEntry;
  locale: "ar" | "en";
  tr: (k: "top_games_winner") => string;
}) {
  return (
    <a
      href={game.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl overflow-hidden border transition hover:-translate-y-0.5"
      style={{
        borderColor: "color-mix(in oklab, var(--color-accent) 55%, transparent)",
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 14%, transparent), color-mix(in oklab, var(--color-accent-2) 10%, transparent))",
      }}
    >
      <div className="grid md:grid-cols-2 gap-0 items-stretch">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.cover}
          alt={game.name}
          loading="lazy"
          className="w-full h-full object-cover min-h-[160px]"
        />
        <div className="p-5 md:p-6 flex flex-col justify-center text-center md:text-start">
          <div
            className="inline-flex self-center md:self-start items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white mb-3"
            style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}
          >
            🏆 {tr("top_games_winner")}
          </div>
          <div className="text-xl md:text-2xl font-black leading-tight mb-1.5 break-words">
            {game.name}
          </div>
          <div className="text-sm text-[color:var(--color-muted)]">
            {locale === "ar" ? "من تطوير" : "by"} {game.dev}
          </div>
          <div className="text-[10px] text-[color:var(--color-muted)] mt-1 leading-snug">{game.country}</div>
        </div>
      </div>
    </a>
  );
}

function GameCard({ game, locale }: { game: ResultEntry; locale: "ar" | "en" }) {
  return (
    <a
      href={game.url}
      target="_blank"
      rel="noreferrer"
      className="card-glow overflow-hidden flex flex-col transition hover:-translate-y-0.5 hover:bg-[color:var(--color-surface)]"
    >
      <div className="relative aspect-[315/250] bg-[color:var(--color-bg-2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.cover}
          alt={game.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <span
          className="absolute top-1.5 start-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}
        >
          {rankLabel(game.rank, locale)}
        </span>
      </div>

      <div className="p-2.5 flex-1 flex flex-col">
        <div className="text-[13px] font-bold leading-snug break-words">{game.name}</div>
        <div className="text-[10px] text-[color:var(--color-muted)] mt-1 leading-snug">
          {locale === "ar" ? "من تطوير" : "by"} {game.dev} · {game.country}
        </div>
        {game.award_ar && (
          <div
            className="mt-2 text-[10px] leading-snug rounded px-1.5 py-1 self-start"
            style={{
              color: "var(--color-accent)",
              background: "color-mix(in oklab, var(--color-accent) 12%, transparent)",
            }}
          >
            🏅 {game.award_ar}
          </div>
        )}
      </div>
    </a>
  );
}
