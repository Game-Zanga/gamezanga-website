"use client";

import { useLocale } from "@/components/LocaleProvider";
import { ABOUT_LONG, WHAT_IS_GAME_JAM } from "@/lib/content";
import { JAM_CONFIG, PAST_EDITIONS } from "@/lib/jam-config";

export default function AboutPage() {
  const { locale, tr } = useLocale();
  const paragraphs = ABOUT_LONG[locale];

  return (
    <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-10">{tr("about_heading")}</h1>

      <div className="space-y-5 text-[color:var(--color-muted)] leading-loose mb-12">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="card-glow p-6 mb-12">
        <h2 className="text-xl font-bold mb-3">
          {locale === "ar" ? "ما هو الـ Game Jam؟" : "What is a Game Jam?"}
        </h2>
        <p className="text-[color:var(--color-muted)] leading-relaxed">{WHAT_IS_GAME_JAM[locale]}</p>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-center">
        {locale === "ar" ? "النسخ السابقة" : "Past Editions"}
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <a
          href={JAM_CONFIG.itchio_url}
          target="_blank"
          rel="noreferrer"
          className="card-glow p-5 hover:bg-[color:var(--color-surface)] transition"
        >
          <div className="text-xs text-[color:var(--color-muted)] mb-1">
            {locale === "ar" ? "النسخة الحالية" : "Current edition"}
          </div>
          <div className="font-bold text-lg">
            {locale === "ar" ? `النسخة ${JAM_CONFIG.edition}` : `Edition ${JAM_CONFIG.edition}`}
          </div>
          <div className="text-sm text-[color:var(--color-muted)] mt-1">{JAM_CONFIG.itchio_url}</div>
        </a>
        {PAST_EDITIONS.map((e) => (
          <a
            key={e.edition}
            href={e.itchio_url}
            target="_blank"
            rel="noreferrer"
            className="card-glow p-5 hover:bg-[color:var(--color-surface)] transition"
          >
            <div className="text-xs text-[color:var(--color-muted)] mb-1">{e.year}</div>
            <div className="font-bold text-lg">
              {locale === "ar" ? `النسخة ${e.edition}` : `Edition ${e.edition}`}
            </div>
            <div className="text-sm text-[color:var(--color-muted)] mt-1">{e.itchio_url}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
