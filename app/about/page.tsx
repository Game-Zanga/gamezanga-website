"use client";

import { useLocale } from "@/components/LocaleProvider";
import { ABOUT_LONG, WHAT_IS_GAME_JAM } from "@/lib/content";
import { JAM_CONFIG, PAST_EDITIONS, type PastEdition } from "@/lib/jam-config";

export default function AboutPage() {
  const { locale, tr } = useLocale();
  const paragraphs = ABOUT_LONG[locale];

  // Current edition is rendered at the top of the grid, then all past editions.
  const current: PastEdition = {
    edition: JAM_CONFIG.edition,
    year: new Date(JAM_CONFIG.jam_start).getFullYear(),
    itchio_url: JAM_CONFIG.itchio_url,
    poster_url: "",
  };

  return (
    <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-10">{tr("about_heading")}</h1>

      <div className="max-w-3xl mx-auto space-y-5 text-[color:var(--color-muted)] leading-loose mb-12">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="max-w-3xl mx-auto card-glow p-6 mb-16">
        <h2 className="text-xl font-bold mb-3">
          {locale === "ar" ? "ما هو الـ Game Jam؟" : "What is a Game Jam?"}
        </h2>
        <p className="text-[color:var(--color-muted)] leading-relaxed">{WHAT_IS_GAME_JAM[locale]}</p>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">
        {locale === "ar" ? "النسخ السابقة" : "Past Editions"}
      </h2>
      <p className="text-center text-[color:var(--color-muted)] mb-10">
        {locale === "ar" ? "من ٢٠١١ إلى اليوم" : "From 2011 to today"}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        <EditionCard edition={current} locale={locale} current />
        {PAST_EDITIONS.map((e, i) => (
          <EditionCard key={`${e.edition ?? "special"}-${i}`} edition={e} locale={locale} />
        ))}
      </div>
    </section>
  );
}

function EditionCard({
  edition,
  locale,
  current = false,
}: {
  edition: PastEdition;
  locale: "ar" | "en";
  current?: boolean;
}) {
  const label =
    locale === "ar"
      ? edition.label_ar || (edition.edition != null ? `النسخة ${edition.edition}` : "")
      : edition.label_en || (edition.edition != null ? `Edition ${edition.edition}` : "");

  const inner = (
    <div className="card-glow overflow-hidden h-full flex flex-col hover:bg-[color:var(--color-surface)] transition">
      <div className="relative aspect-[3/4] bg-[color:var(--color-bg-2)] overflow-hidden">
        {edition.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={edition.poster_url}
            alt={`${label} — ${edition.year}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[color:var(--color-muted)] text-sm">
            {locale === "ar" ? "بدون ملصق" : "No poster"}
          </div>
        )}
        {current && (
          <div
            className="absolute top-2 start-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}
          >
            {locale === "ar" ? "الحالية" : "Current"}
          </div>
        )}
      </div>
      <div className="p-2.5 md:p-3">
        <div className="font-bold text-sm leading-tight truncate">{label}</div>
        <div className="text-[11px] text-[color:var(--color-muted)] mt-0.5" dir="ltr">
          {edition.year}
        </div>
        {(edition.theme_ar || edition.theme_en) && (
          <div className="text-[11px] text-[color:var(--color-muted)] mt-1 truncate">
            {locale === "ar" ? edition.theme_ar : edition.theme_en}
          </div>
        )}
      </div>
    </div>
  );

  return edition.itchio_url ? (
    <a href={edition.itchio_url} target="_blank" rel="noreferrer" aria-label={`${label} ${edition.year}`}>
      {inner}
    </a>
  ) : (
    <div title={`${label} ${edition.year}`}>{inner}</div>
  );
}
